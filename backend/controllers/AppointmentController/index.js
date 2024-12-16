const Appointment = require("../../models/Appointment");
const Appointment_history = require("../../models/Appointment_history");
const validateAppointment = require("../../requests/validateAppointment");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Notification = require("../../models/Notification");
const transporter = require("../../helpers/mailer-config");
const User = require("../../models/User");
const moment = require("moment-timezone");
require("moment/locale/vi");
const User_role = require("../../models/User_role");
const Role = require("../../models/Role");
const Payment = require("../../models/Payment");

const findAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find({});

    // Lọc các lịch hẹn không có patient_id
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.patient_id
    );

    if (!filteredAppointments || filteredAppointments.length === 0) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    // Sắp xếp các cuộc hẹn theo createdAt từ mới nhất đến cũ nhất
    filteredAppointments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const appointmentsWithDetails = await Promise.all(
      filteredAppointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });
        const patientInfo = patient
          ? await User.findOne({ _id: patient.user_id })
          : null;
        const doctor = await Doctor.findOne({ _id: appointment.doctor_id });
        const doctorInfo = doctor
          ? await User.findOne({ _id: doctor.user_id })
          : null;

        return {
          ...appointment.toObject(),
          patientInfo: patientInfo || {}, // Trả về đối tượng rỗng nếu không tìm thấy
          doctorInfo: doctorInfo || {}, // Trả về đối tượng rỗng nếu không tìm thấy
        };
      })
    );

    return res
      .status(200)
      .json({ success: true, appointments: appointmentsWithDetails });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateAppointment = async (req, res) => {
  try {
    const user_id = req.user.id;
    if (!user_id) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Validate dữ liệu từ client
    const { error } = validateAppointment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    const oldDate = moment(appointment.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, DD MMMM YYYY");

    const oldShift = appointment.work_shift === "morning" ? "Sáng" : "Chiều";

    const appointmentUpdate = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );

    if (!appointmentUpdate) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    const patient = await Patient.findById(appointmentUpdate.patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const doctor = await Doctor.findById(appointmentUpdate.doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const patientInfo = await User.findOne({ _id: patient.user_id });
    if (!patientInfo) {
      return res
        .status(404)
        .json({ message: "Information of patient not found" });
    }
    const doctorInfo = await User.findOne({ _id: doctor.user_id });
    if (!doctorInfo) {
      return res
        .status(404)
        .json({ message: "Information of doctor not found" });
    }

    const newDate = moment(appointmentUpdate.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, MMMM DD YYYY");

    const newShift =
      appointmentUpdate.work_shift === "morning" ? "Sáng" : "Chiều";
    const time =
      appointmentUpdate.work_shift === "morning" ? "7h30-11h30" : "13h30-17h30";

    await Notification.create({
      patient_id: appointmentUpdate.patient_id,
      doctor_id: appointmentUpdate.doctor_id,
      content: `Thông báo lịch hẹn ${oldDate}- Ca: ${oldShift} của bạn đã thay đổi: \nNgày khám mới: ${newDate}. \n Ca khám mới: ${newShift}.\n Thời gian diễn ra: ${time}`,
      appointment_id: appointmentUpdate._id,
      recipientType: "patient",
    });

    const mailOptionsPatient = {
      from: process.env.EMAIL_USER,
      to: patientInfo.email,
      subject: "Thông báo lịch hẹn:",
      text: `Xin chào ${patientInfo.name}, lịch hẹn của bạn đã thay đổi: \nNgày khám mới: ${newDate}. \n Ca khám mới: ${newShift}.\n\nThời gian diễn ra: ${time}. \n\n Trân trọng!`,
    };

    // Gửi email
    await transporter.sendMail(mailOptionsPatient);

    return res.status(200).json(appointmentUpdate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = req.body;

    const patient = await Patient.findOne({ user_id: user_id });
    if (!patient) {
      return res
        .status(400)
        .json({ success: false, message: "Patient not found" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res
        .status(400)
        .json({ success: false, message: "Appointment not found" });
    }
    await Appointment.findByIdAndDelete(id);
    await Appointment_history.deleteMany({
      appointment_id: id,
      patient_id: patient._id,
    });
    return res
      .status(200)
      .json({ success: true, message: "Delete appointment success!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const formatVietnameseDate = (date) => {
  moment.locale("vi");
  const formattedDate = moment
    .utc(date)
    .tz("Asia/Ho_Chi_Minh")
    .format("dddd, DD-MM-YYYY");
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

// const patientCreateAppointment = async (req, res) => {
//   try {
//     const user_id = req.params.id;

//     // Lấy thông tin bệnh nhân
//     const patient = await Patient.findOne({ user_id: user_id });
//     if (!patient) {
//       return res.status(400).json({ message: "Patient not found" });
//     }

//     // Kiểm tra bác sĩ có tồn tại hay không
//     const checkDoctor = await Doctor.findOne({ _id: req.body.doctor_id });
//     if (!checkDoctor) {
//       return res.status(400).json({ message: "Bác sĩ không tồn tại!" });
//     }

//     // Kiểm tra xem lịch hẹn đã tồn tại chưa
//     const checkAppointment = await Appointment.findOne({
//       patient_id: patient._id,
//       work_date: req.body.work_date,
//       work_shift: req.body.work_shift,
//       status: { $nin: ["canceled"] },
//     });
//     if (checkAppointment) {
//       return res.status(400).json({ message: "Bạn đã đặt lịch hẹn này rồi!" });
//     }

//     // Kiểm tra nếu đã hủy 2 lần trước đó
//     const canceledCount = await Appointment.countDocuments({
//       patient_id: patient._id,
//       work_date: req.body.work_date,
//       work_shift: req.body.work_shift,
//       status: "canceled",
//     });
//     if (canceledCount >= 2) {
//       return res.status(400).json({
//         message: "Bạn đã hủy lịch hẹn này hai lần, không thể đặt lại!",
//       });
//     }

//     // Kiểm tra số lượng lịch hẹn trong ngày
//     const dailyAppointments = await Appointment.countDocuments({
//       patient_id: patient._id,
//       work_date: req.body.work_date,
//       status: { $nin: ["canceled"] },
//     });

//     if (dailyAppointments >= 4) {
//       return res.status(400).json({
//         message: "Bạn chỉ có thể đặt tối đa 4 lịch hẹn trong một ngày!",
//       });
//     }

//     // Xác định thời gian buổi sáng và buổi chiều
//     const appointmentDate = new Date(req.body.work_date);

//     const morningTime = new Date(appointmentDate);
//     morningTime.setUTCHours(7, 30, 0, 0); // 7h30 sáng (UTC)

//     const afternoonTime = new Date(appointmentDate);
//     afternoonTime.setUTCHours(13, 30, 0, 0); // 1h30 chiều (UTC)

//     // Thời gian hiện tại (UTC)
//     const currentTime = new Date();

//     // Kiểm tra nếu là buổi sáng
//     if (appointmentDate >= morningTime && appointmentDate < afternoonTime) {
//       // Loại bỏ điều kiện kiểm tra 30 phút
//       if (currentTime > morningTime) {
//         return res.status(400).json({
//           message:
//             "Bạn chỉ có thể đặt lịch hẹn cho buổi sáng trước giờ diễn ra!",
//         });
//       }
//     }

//     // Kiểm tra nếu là buổi chiều
//     if (appointmentDate >= afternoonTime) {
//       // Loại bỏ điều kiện kiểm tra 30 phút
//       if (currentTime > afternoonTime) {
//         return res.status(400).json({
//           message:
//             "Bạn chỉ có thể đặt lịch hẹn cho buổi chiều trước giờ diễn ra!",
//         });
//       }
//     }

//     // Tạo lịch hẹn
//     const appointment = await Appointment.create({
//       ...req.body,
//       patient_id: patient._id,
//     });

//     // Lưu vào lịch sử hẹn
//     await Appointment_history.create({
//       appointment_id: appointment._id,
//       patient_id: patient._id,
//       doctor_id: appointment.doctor_id,
//     });

//     const formattedDate = formatVietnameseDate(appointment.work_date);

//     // Tạo thông báo
//     await Notification.create({
//       patient_id: appointment.patient_id,
//       doctor_id: appointment.doctor_id,
//       content: `Bạn đã đặt lịch hẹn vào ngày: ${formattedDate}, hãy chờ phản hồi từ bác sĩ.`,
//       appointment_id: appointment._id,
//       recipientType: "patient",
//     });

//     await Notification.create({
//       patient_id: appointment.patient_id,
//       doctor_id: appointment.doctor_id,
//       content: `Bạn có lịch hẹn đang chờ xác nhận vào ngày: ${formattedDate}.`,
//       appointment_id: appointment._id,
//       recipientType: "doctor",
//     });

//     return res.status(200).json(appointment);
//   } catch (error) {
//     return res.status(500).json({ message: error.message });
//   }
// };
const patientCreateAppointment = async (req, res) => {
  try {
    const user_id = req.params.id;

    // Lấy thông tin bệnh nhân
    const patient = await Patient.findOne({ user_id: user_id });
    if (!patient) {
      return res.status(400).json({ message: "Patient not found" });
    }

    // Kiểm tra bác sĩ có tồn tại hay không
    const checkDoctor = await Doctor.findOne({ _id: req.body.doctor_id });
    if (!checkDoctor) {
      return res.status(400).json({ message: "Bác sĩ không tồn tại!" });
    }

    // Kiểm tra xem lịch hẹn đã tồn tại chưa
    const checkAppointment = await Appointment.findOne({
      patient_id: patient._id,
      work_date: req.body.work_date,
      work_shift: req.body.work_shift,
      status: { $nin: ["canceled"] },
    });
    if (checkAppointment) {
      return res.status(400).json({ message: "Bạn đã đặt lịch hẹn này rồi!" });
    }

    // Kiểm tra nếu đã hủy 2 lần trước đó
    const canceledCount = await Appointment.countDocuments({
      patient_id: patient._id,
      work_date: req.body.work_date,
      work_shift: req.body.work_shift,
      status: "canceled",
    });
    if (canceledCount >= 2) {
      return res.status(400).json({
        message: "Bạn đã hủy lịch hẹn này hai lần, không thể đặt lại!",
      });
    }

    // Kiểm tra số lượng lịch hẹn trong ngày
    const dailyAppointments = await Appointment.countDocuments({
      patient_id: patient._id,
      work_date: req.body.work_date,
      status: { $nin: ["canceled"] },
    });

    if (dailyAppointments >= 4) {
      return res.status(400).json({
        message: "Bạn chỉ có thể đặt tối đa 4 lịch hẹn trong một ngày!",
      });
    }

    // Xác định thời gian buổi sáng và buổi chiều
    const appointmentDate = new Date(req.body.work_date);
    
    // Thời gian hiện tại (UTC)
    const currentTime = new Date();

    // Kiểm tra ca làm việc
    if (req.body.work_shift === "morning") {
      const morningDeadline = new Date(appointmentDate);
      morningDeadline.setUTCHours(7, 30, 0, 0); // 7h30 sáng (UTC)

      if (currentTime > morningDeadline) {
        return res.status(400).json({
          message: "Bạn chỉ có thể đặt lịch hẹn cho buổi sáng trước 7h30!",
        });
      }
    } else if (req.body.work_shift === "afternoon") {
      const afternoonDeadline = new Date(appointmentDate);
      afternoonDeadline.setUTCHours(13, 30, 0, 0); // 1h30 chiều (UTC)

      if (currentTime > afternoonDeadline) {
        return res.status(400).json({
          message: "Bạn chỉ có thể đặt lịch hẹn cho buổi chiều trước 13h30!",
        });
      }
    }

    // Tạo lịch hẹn
    const appointment = await Appointment.create({
      ...req.body,
      patient_id: patient._id,
    });

    // Lưu vào lịch sử hẹn
    await Appointment_history.create({
      appointment_id: appointment._id,
      patient_id: patient._id,
      doctor_id: appointment.doctor_id,
    });

    const formattedDate = formatVietnameseDate(appointment.work_date);

    // Tạo thông báo
    await Notification.create({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      content: `Bạn đã đặt lịch hẹn vào ngày: ${formattedDate}, hãy chờ phản hồi từ bác sĩ.`,
      appointment_id: appointment._id,
      recipientType: "patient",
    });

    await Notification.create({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      content: `Bạn có lịch hẹn đang chờ xác nhận vào ngày: ${formattedDate}.`,
      appointment_id: appointment._id,
      recipientType: "doctor",
    });

    return res.status(200).json(appointment);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCurrentUserAppointments = async (req, res) => {
  try {
    const user_id = req.user?.id;
    const user_role = req.user?.role;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let appointments;

    if (user_role === "patient") {
      const patient = await Patient.findOne({ user_id: user_id });
      if (!patient) {
        return res.status(400).json({ message: "Patient not found" });
      }

      appointments = await Appointment.find({
        patient_id: patient._id,
        work_date: { $gte: today },
      })
        .populate({
          path: "patient_id",
          populate: {
            path: "user_id",
            select: "name",
          },
        })
        .populate({
          path: "doctor_id",
          populate: {
            path: "user_id",
            select: "name image",
          },
        })
        .sort({ updatedAt: -1 });
    } else if (user_role === "doctor") {
      const doctor = await Doctor.findOne({ user_id: user_id });
      if (!doctor) {
        return res.status(400).json({ message: "Doctor not found" });
      }

      appointments = await Appointment.find({
        doctor_id: doctor._id,
        work_date: { $gte: today },
        status: "pending",
      })
        .populate({
          path: "patient_id",
          populate: {
            path: "user_id",
            select: "name",
          },
        })
        .populate({
          path: "doctor_id",
          populate: {
            path: "user_id",
            select: "name image",
          },
        })
        .sort({ updatedAt: -1 });
    }

    // Lọc các lịch hẹn không có patient_id
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.patient_id
    );

    if (filteredAppointments.length > 0) {
      return res.status(200).json(filteredAppointments);
    }

    return res.status(404).json({ message: "Appointments not found" });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return res.status(500).json({ message: error.message });
  }
};

const processPrematureCancellation = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    const patient = await Patient.findById(appointment.patient_id);
    if (!patient) {
      return res.status(400).json({ message: "Patient not found" });
    }

    const infoPatient = await User.findById(patient.user_id);
    if (!infoPatient) {
      return res.status(400).json({ message: "Info patient not found" });
    }

    const doctor = await Doctor.findById(appointment.doctor_id);
    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    const infoDoctor = await User.findById(doctor.user_id);
    if (!infoDoctor) {
      return res.status(400).json({ message: "Info doctor not found" });
    }

    // Lấy thời gian hiện tại và thời gian hẹn
    const now = new Date();
    const appointmentDate = new Date(appointment.work_date);

    // Kiểm tra xem lịch hẹn có còn hơn 1 ngày nữa không
    const timeDifference = appointmentDate - now;
    const oneDayInMillis = 24 * 60 * 60 * 1000;

    if (timeDifference <= oneDayInMillis) {
      return res.status(400).json({
        message: "You can only cancel appointments more than 1 day in advance.",
      });
    }

    // Cập nhật lịch hẹn
    const appointmentUd = await Appointment.findByIdAndUpdate(id, {
      $set: { status: "canceled" },
    });

    if (!appointmentUd) {
      return res.status(404).json({ message: "Update appointment failed" });
    }

    const vietnamTime = moment(appointmentUd.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, MMMM DD YYYY");

    const converWshift =
      appointmentUd.work_shift === "morning" ? "Sáng" : "Chiều";

    await Notification.create({
      patient_id: appointmentUd.patient_id,
      doctor_id: appointmentUd.doctor_id,
      content: `Thông báo: Bệnh nhân ${infoPatient.name} đã huỷ lịch hẹn ngày: ${vietnamTime} - ca khám : ${converWshift}.`,
      appointment_id: appointmentUd._id,
      recipientType: "doctor",
    });

    const mailOptionsDoctor = {
      from: process.env.EMAIL_USER,
      to: infoDoctor.email,
      subject: "Thông báo lịch hẹn: Huỷ lịch hẹn",
      text: `Xin chào bác sĩ, Bệnh nhân ${infoPatient.name} đã huỷ lịch hẹn ngày: ${vietnamTime} - ca khám : ${converWshift}. \n\n Trân trọng.`,
    };
    await transporter.sendMail(mailOptionsDoctor);

    return res.status(200).json({ message: "Delete appointment success!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const showUpcomingAppointments = async (req, res) => {
  try {
    const user_id = req.params.id;

    const user_role = await User_role.findOne({ user_id: user_id });
    if (!user_role) {
      return res.status(403).json({ message: "User role not found" });
    }

    const role = await Role.findOne({ _id: user_role.role_id });
    if (!role) {
      return res.status(403).json({ message: "Role not found" });
    }

    const now = new Date();
    let upcomingAppointments;

    if (role.name === "admin") {
      upcomingAppointments = await Appointment.find({
        work_date: { $gte: now },
      }).sort({ work_date: 1 });
    } else {
      const doctor = await Doctor.findOne({ user_id: user_id });
      if (!doctor) {
        return res.status(403).json({ message: "Doctor not found" });
      }

      upcomingAppointments = await Appointment.find({
        doctor_id: doctor._id,
        work_date: { $gte: now },
        status: "confirmed",
      }).sort({ work_date: 1 });
    }

    // Lọc các lịch hẹn không có patient_id
    const filteredAppointments = upcomingAppointments.filter(
      (appointment) => appointment.patient_id
    );

    const updatedAppointments = await Promise.all(
      filteredAppointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });

        // Chỉ lấy thông tin người dùng nếu bệnh nhân tồn tại
        const user = patient
          ? await User.findOne({ _id: patient.user_id })
          : null;

        return {
          ...appointment.toObject(),
          patient_name: user ? user.name : undefined, // Không thêm tên nếu không tìm thấy user
        };
      })
    );

    // Trả về danh sách lịch hẹn đã lọc
    return res.status(200).json(updatedAppointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getAppointmentByStatus = async (req, res) => {
  try {
    const user_id = req.params.id;

    const user_role = await User_role.findOne({ user_id: user_id });
    if (!user_role) {
      return res.status(403).json({ message: "User role not found" });
    }

    const role = await Role.findOne({ _id: user_role.role_id });
    if (!role) {
      return res.status(403).json({ message: "Role not found" });
    }

    let appointments;
    if (role.name === "admin") {
      appointments = await Appointment.find({
        status: { $in: ["confirmed", "completed"] },
      });
    } else {
      const doctor = await Doctor.findOne({ user_id: user_id });
      if (!doctor) {
        return res.status(403).json({ message: "Doctor not found" });
      }
      appointments = await Appointment.find({
        status: { $in: ["confirmed", "completed"] },
        doctor_id: doctor._id,
      });
    }

    // Lọc các lịch hẹn không có patient_id
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.patient_id
    );

    const updatedAppointments = await Promise.all(
      filteredAppointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });
        const user = patient
          ? await User.findOne({ _id: patient.user_id })
          : null;

        return {
          ...appointment.toObject(),
          patient_name: user ? user.name : undefined, // Không thêm tên nếu không tìm thấy user
        };
      })
    );

    return res.status(200).json(updatedAppointments);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const countAppointmentDoctorDashboard = async (req, res) => {
  try {
    const user_id = req.params.id;
    const doctor = await Doctor.findOne({ user_id: user_id });
    if (!doctor) {
      return res
        .status(403)
        .json({ success: false, message: "Doctor not found" });
    }

    // Đếm số lượng lịch hẹn theo trạng thái và tháng
    const appointments = await Appointment.aggregate([
      {
        $match: {
          doctor_id: doctor._id,
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$work_date" }, // Lấy tháng từ trường word_date
            status: "$status", // Nhóm theo trạng thái
          },
          count: { $sum: 1 }, // Đếm số lượng
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          status: "$_id.status",
          count: 1,
        },
      },
      {
        $sort: { year: 1, month: 1, status: 1 }, // Sắp xếp theo năm, tháng và trạng thái
      },
    ]);

    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getUpcomingAppointmentsDashboardAdmin = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      work_date: { $gte: today },
      status: "confirmed",
    })
      .populate({
        path: "doctor_id",
        populate: {
          path: "user_id",
          select: "name image",
        },
        select: "-specialization_id -description -createdAt -updatedAt -__v",
      })
      .populate({
        path: "patient_id",
        populate: {
          path: "user_id",
          select: "name",
        },
        select: "-__v",
      })
      .sort({ work_date: 1 });

    // Lọc các lịch hẹn không có patient_id
    const filteredAppointments = appointments.filter(
      (appointment) => appointment.patient_id
    );

    if (filteredAppointments.length <= 0) {
      return res
        .status(200)
        .json({ success: false, message: "Appointment not found" });
    }

    return res.status(200).json({ success: true, data: filteredAppointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllAppointmentAdmin = async (req, res) => {
  try {
    const appointments = await Appointment.find({ status: "completed" });
    if (appointments.length <= 0) {
      return res
        .status(200)
        .json({ success: false, message: "Appointment not found" });
    }
    return res.status(200).json({ success: true, data: appointments });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAppointmentByStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res
        .status(400)
        .json({ success: false, message: "Appointment not found" });
    }
    await Appointment.findByIdAndDelete(id);
    await Appointment_history.deleteMany({ appointment_id: id });
    await Payment.deleteMany({ appointment_id: id });
    return res
      .status(200)
      .json({ success: true, message: "Delete appointment success!" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const findAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm cuộc hẹn theo ID
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
    }

    // Tìm bệnh nhân theo ID trong cuộc hẹn
    const patient = await Patient.findById(appointment.patient_id);
    if (!patient) {
      return res
        .status(404)
        .json({ success: false, message: "Patient not found" });
    }

    // Tìm thông tin bệnh nhân
    const infoPatient = await User.findById(patient.user_id);
    if (!infoPatient) {
      return res
        .status(404)
        .json({ success: false, message: "Info patient not found" });
    }

    // Tìm bác sĩ theo ID trong cuộc hẹn
    const doctor = await Doctor.findById(appointment.doctor_id);
    if (!doctor) {
      return res
        .status(404)
        .json({ success: false, message: "Doctor not found" });
    }

    // Tìm thông tin bác sĩ
    const infoDoctor = await User.findById(doctor.user_id);
    if (!infoDoctor) {
      return res
        .status(404)
        .json({ success: false, message: "Info doctor not found" });
    }

    // Tạo phản hồi với thông tin cuộc hẹn
    const result = {
      id: appointment._id,
      work_date: appointment.work_date,
      status: appointment.status,
      patient_id: patient._id,
      patient_name: infoPatient.name,
      patient_image: infoPatient.image,
      doctor_id: doctor._id,
      doctor_name: infoDoctor.name,
      doctor_image: infoDoctor.image,
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const adminUpdateAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { patient_id } = req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    const checkAppointmentPatient = await Appointment.findOne({
      patient_id: patient_id,
      work_date: req.body.work_date,
      work_shift: req.body.work_shift,
    });
    if (checkAppointmentPatient) {
      return res
        .status(400)
        .json({ message: "Bệnh nhân đã tồn tại lịch hẹn này rồi!" });
    }

    const oldDate = moment(appointment.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, MMMM DD YYYY");

    const oldShift = appointment.work_shift === "morning" ? "Sáng" : "Chiều";

    const appointmentUpdate = await Appointment.findByIdAndUpdate(
      id,
      req.body,
      {
        new: true,
      }
    );

    if (!appointmentUpdate) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    const patient = await Patient.findById(appointmentUpdate.patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const doctor = await Doctor.findById(appointmentUpdate.doctor_id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    const patientInfo = await User.findOne({ _id: patient.user_id });
    if (!patientInfo) {
      return res
        .status(404)
        .json({ message: "Information of patient not found" });
    }
    const doctorInfo = await User.findOne({ _id: doctor.user_id });
    if (!doctorInfo) {
      return res
        .status(404)
        .json({ message: "Information of doctor not found" });
    }

    const newDate = moment(appointmentUpdate.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, DD MMMM YYYY");

    const newShift =
      appointmentUpdate.work_shift === "morning" ? "Sáng" : "Chiều";
    const time =
      appointmentUpdate.work_shift === "morning" ? "7h30-11h30" : "13h30-17h30";

    await Notification.create({
      patient_id: appointmentUpdate.patient_id,
      doctor_id: appointmentUpdate.doctor_id,
      content: `Thông báo lịch hẹn ${oldDate}- Ca: ${oldShift} của bạn đã thay đổi: \nNgày khám mới: ${newDate}. \n Ca khám mới: ${newShift}.\n Thời gian diễn ra: ${time}`,
      appointment_id: appointmentUpdate._id,
      recipientType: "patient",
    });

    const mailOptionsPatient = {
      from: process.env.EMAIL_USER,
      to: patientInfo.email,
      subject: "Thông báo lịch hẹn:",
      text: `Xin chào ${patientInfo.name}, lịch hẹn của bạn đã thay đổi: \nNgày khám mới: ${newDate}. \n Ca khám mới: ${newShift}.\n\nThời gian diễn ra: ${time}. \n\n Trân trọng!`,
    };

    // Gửi email
    await transporter.sendMail(mailOptionsPatient);

    return res.status(200).json({success: true, data: appointmentUpdate});
  } catch (error) {
    return res.status(500).json({success: false, message: error.message });
  }
};

module.exports = {
  findAppointment,
  findAllAppointment,
  updateAppointment,
  deleteAppointment,
  patientCreateAppointment,
  getCurrentUserAppointments,
  processPrematureCancellation,
  showUpcomingAppointments,
  getAppointmentByStatus,
  countAppointmentDoctorDashboard,
  getUpcomingAppointmentsDashboardAdmin,
  getAllAppointmentAdmin,
  deleteAppointmentByStatus,
  adminUpdateAppointment,
};
