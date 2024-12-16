const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const RoleUser = require("../../models/User_role");
const Role = require("../../models/Role");
const Schedule = require("../../models/Schedule");
const validatePatient = require("../../requests/validatePatient");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Appointment = require("../../models/Appointment");
const Payment = require("../../models/Payment");
const History_appointment = require("../../models/Appointment_history");
JWT_SECRET = process.env.JWT_SECRET;

const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GG_CLIENT_ID);
const transporter = require("../../helpers/mailer-config");
const EMAIL_USER = process.env.EMAIL_USER;

const register = async (req, res) => {
  try {
    // Validate dữ liệu từ client
    const { error } = validatePatient(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Băm mật khẩu
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const patient = await User.create({
      ...req.body,
      password: hashedPassword,
    });

    if (patient) {
      const role = await Role.findOne({ name: "patient" });

      if (!role) {
        return res.status(400).json({ message: "Role 'patient' not found" });
      }

      const roleUser = await RoleUser.create({
        user_id: patient._id,
        role_id: role._id,
      });

      if (!roleUser) {
        return res.status(400).json({ message: "User Role create failed" });
      }

      await Patient.create({
        user_id: patient._id,
      });

      // Trả về thông tin người dùng
      res.status(200).json(patient);
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found!" });
    }

    // So sánh mật khẩu
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password!" });
    }

    // Lấy danh sách role của người dùng
    const roleUsers = await RoleUser.find({ user_id: user._id }).populate(
      "role_id"
    );
    const userRole = roleUsers.length > 0 ? roleUsers[0].role_id.name : null;

    // Tạo token JWT
    const token = jwt.sign({ id: user._id, role: userRole }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: userRole,
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

const logout = async (req, res) => {
  try {
    // Xóa thông tin người dùng trong session
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out." });
      }
      return res.status(200).json({ message: "Logout successful!" });
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const filter = async (req, res) => {
  try {
    const { doctorId, filterType, specialization } = req.query;
    const now = new Date();
    let startDate, endDate;

    switch (filterType) {
      case "today":
        startDate = new Date(now.setHours(0, 0, 0, 0));
        endDate = new Date(now.setHours(23, 59, 59, 999));
        break;
      case "week":
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
        endDate = new Date(startOfWeek.setDate(startOfWeek.getDate() + 6));
        endDate = new Date(endDate.setHours(23, 59, 59, 999));
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate = new Date(endDate.setHours(23, 59, 59, 999));
        break;
      default:
        return res.status(400).json({ message: "Invalid filter type" });
    }

    const query = {
      work_date: { $gte: startDate, $lte: endDate },
    };

    if (specialization) {
      query.specialization = specialization;
    }

    const schedules = await Schedule.find(query).sort({ work_date: 1 });

    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getHistoryAppointment = async (req, res) => {
  try {
    const { id } = req.params; // id user

    const user = await User.findOne({ _id: id });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const patient = await Patient.findOne({ user_id: user._id });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const appointments = await Appointment.find({ patient_id: patient._id });
    if (appointments.length === 0) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    const detailedHistoryAppointments = [];
    for (const appointment of appointments) {
      const historyEntries = await History_appointment.find({
        appointment_id: appointment._id,
      });

      const doctor = await Doctor.findById(appointment.doctor_id);
      const nameDoctor = await User.findById({ _id: doctor.user_id }).select(
        "name"
      );
      const imageDoctor = await User.findById({ _id: doctor.user_id }).select(
        "image"
      );

      for (const history of historyEntries) {
        detailedHistoryAppointments.push({
          history: {
            work_shift: appointment.work_shift,
            work_date: appointment.work_date,
            status: appointment.status,
            doctor_name: nameDoctor ? nameDoctor.name : "Unknown Name Doctor",
            doctor_image: imageDoctor
              ? imageDoctor.image
              : "Unknown Image Doctor",
            createdAt: history.createdAt,
            updatedAt: history.updatedAt,
          },
        });
      }
    }

    if (detailedHistoryAppointments.length === 0) {
      return res
        .status(404)
        .json({ message: "History appointment not found!" });
    }

    // Sort appointments by work_date in descending order
    detailedHistoryAppointments.sort(
      (a, b) => new Date(b.history.updatedAt) - new Date(a.history.updatedAt)
    );

    return res.status(200).json({
      historyAppointments: detailedHistoryAppointments,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};

// const getdataMoneyDashboardAdmin = async (req, res) => {
//   try {
//     const payments = await Payment.find({}).populate("appointment_id");
//     if (!payments) {
//       return res.status(404).json({ message: "Payment not found" });
//     }

//     // Nhóm theo tháng và tính tổng số tiền
//     const revenueByMonth = payments.reduce((acc, payment) => {
//       const workDate = payment.appointment_id.work_date;
//       const month = new Date(workDate).toLocaleString("default", {
//         month: "long",
//       }); // Lấy tên tháng
//       acc[month] = (acc[month] || 0) + payment.amount; // Cộng dồn số tiền
//       return acc;
//     }, {});

//     // Chuyển đổi kết quả thành mảng
//     const revenueData = Object.entries(revenueByMonth).map(
//       ([month, revenue]) => ({ month, revenue })
//     );

//     return res.status(200).json(revenueData);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
const getdataMoneyDashboardAdmin = async (req, res) => {
  try {
    const payments = await Payment.find({}).populate("appointment_id");
    if (!payments) {
      return res.status(404).json({ message: "Payment not found" });
    }

    // Nhóm theo tháng và tính tổng số tiền
    const revenueByMonth = payments.reduce((acc, payment) => {
      // Kiểm tra xem appointment_id có tồn tại không
      if (payment.appointment_id) {
        const workDate = payment.appointment_id.work_date;
        const month = new Date(workDate).toLocaleString("default", {
          month: "long",
        }); // Lấy tên tháng
        acc[month] = (acc[month] || 0) + payment.amount; // Cộng dồn số tiền
      }
      return acc;
    }, {});

    // Chuyển đổi kết quả thành mảng
    const revenueData = Object.entries(revenueByMonth).map(
      ([month, revenue]) => ({ month, revenue })
    );

    return res.status(200).json(revenueData);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const getAllScheduleDoctor = async (req, res) => {
  try {
    // Lấy danh sách bác sĩ
    const doctors = await Doctor.find({})
      .populate("user_id", "name image")
      .populate("specialization_id", "name");
    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Lấy lịch làm việc của các bác sĩ
    const schedules = await Schedule.find({
      doctor_id: { $in: doctors.map((doctor) => doctor._id) },
    });
    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Kết hợp thông tin bác sĩ với lịch làm việc
    const result = doctors.map((doctor) => {
      const doctorSchedules = schedules
        .filter((schedule) => schedule.doctor_id.equals(doctor._id))
        .map((schedule) => ({
          _id: schedule._id,
          work_date: schedule.work_date,
          work_shift: schedule.work_shift,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          doctorName: doctor.user_id.name, // Thêm tên bác sĩ
          doctorImage: doctor.user_id.image, // Thêm ả bác sĩ
        }));

      return {
        doctorId: doctor._id,
        doctorName: doctor.user_id.name,
        doctorImage: doctor.user_id.image,
        specialization: doctor.specialization_id.name,
        schedules: doctorSchedules,
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GG_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const email = payload.email;

    // Kiểm tra xem người dùng đã tồn tại chưa
    let user = await User.findOne({ email });
    if (!user) {
      // Nếu không tồn tại, tạo người dùng mới
      user = await User.create({
        email,
        name: payload.name,
        password: "123456",
      });
      const role = await Role.findOne({ name: "patient" });

      if (!role) {
        return res.status(400).json({ message: "Role 'patient' not found" });
      }
      const roleUser = await RoleUser.create({
        user_id: user._id,
        role_id: role._id,
      });

      if (!roleUser) {
        return res.status(400).json({ message: "User Role create failed" });
      }

      await Patient.create({
        user_id: user._id,
      });
    }

    // Tạo token JWT
    const roleUsers = await RoleUser.find({ user_id: user._id }).populate(
      "role_id"
    );
    const userRole = roleUsers.length > 0 ? roleUsers[0].role_id.name : null;

    const token = jwt.sign({ id: user._id, role: userRole }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: userRole,
        token: token,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error." });
  }
};

// Route quên mật khẩu
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    // Tạo mã khôi phục và lưu vào cơ sở dữ liệu
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Hết hạn sau 1 giờ
    await user.save();

    // Gửi email khôi phục mật khẩu
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const mailOptions = {
      to: email,
      subject: "Khôi phục mật khẩu",
      text: `Bạn đã yêu cầu khôi phục mật khẩu. Vui lòng nhấp vào liên kết sau để đặt lại mật khẩu: ${resetUrl}`,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: "Email khôi phục mật khẩu đã được gửi!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi!" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Token không hợp lệ hoặc đã hết hạn!" });
    }

    // Băm mật khẩu mới
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Mật khẩu đã được đặt lại thành công!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Đã xảy ra lỗi!" });
  }
};

const contact = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res
        .status(400)
        .send({ message: "Vui lòng điền đầy đủ thông tin." });
    }

    const mailOptions = {
      from: email,
      to: EMAIL_USER,
      subject: `Tin nhắn từ ${name}`,
      text: message,
    };
    await transporter.sendMail(mailOptions);

    return res
      .status(200)
      .send({ success: true, message: "Email đã được gửi thành công!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

// Hàm lấy lịch hẹn đã lọc
const getFilteredScheduleDoctor = async (req, res) => {
  const { specialization, date } = req.query;

  try {
    // Lấy danh sách bác sĩ
    const doctors = await Doctor.find({})
      .populate("user_id", "name image")
      .populate("specialization_id", "name");

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Lấy lịch làm việc của các bác sĩ
    const schedules = await Schedule.find({
      doctor_id: { $in: doctors.map((doctor) => doctor._id) },
    });

    if (!schedules || schedules.length === 0) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Kết hợp thông tin bác sĩ với lịch làm việc
    const result = doctors.map((doctor) => {
      const doctorSchedules = schedules
        .filter((schedule) => schedule.doctor_id.equals(doctor._id))
        .map((schedule) => ({
          _id: schedule._id,
          work_date: schedule.work_date,
          work_shift: schedule.work_shift,
          createdAt: schedule.createdAt,
          updatedAt: schedule.updatedAt,
          doctorName: doctor.user_id.name,
          doctorImage: doctor.user_id.image,
        }));

      return {
        doctorId: doctor._id,
        doctorName: doctor.user_id.name,
        doctorImage: doctor.user_id.image,
        specialization: doctor.specialization_id.name,
        schedules: doctorSchedules,
      };
    });

    // Lọc theo chuyên khoa
    if (specialization) {
      result = result.filter(doctor => doctor.specialization === specialization);
    }

    // Lọc theo ngày
    if (date) {
      result = result.map(doctor => ({
        ...doctor,
        schedules: doctor.schedules.filter(schedule => {
          const workDate = new Date(schedule.work_date).toISOString().split("T")[0];
          return workDate === date;
        }),
      })).filter(doctor => doctor.schedules.length > 0);
    }

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  register,
  login,
  logout,
  filter,
  getHistoryAppointment,
  getdataMoneyDashboardAdmin,
  getAllScheduleDoctor,
  googleLogin,
  forgotPassword,
  resetPassword,
  contact,
  getFilteredScheduleDoctor
};
