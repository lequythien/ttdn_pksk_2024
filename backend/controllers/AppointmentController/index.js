const Appointment = require("../../models/Appointment");
const Appointment_history = require("../../models/Appointment_history");
const validateAppointment = require("../../requests/validateAppointment");
const Patient = require("../../models/Patient");
const Doctor = require("../../models/Doctor");
const Notification = require("../../models/Notification");
const transporter = require("../../helpers/mailer-config");
const User = require("../../models/User");
const moment = require("moment-timezone");
const User_role = require("../../models/User_role");
const Role = require("../../models/Role");

const createAppointment = async (req, res) => {
  try {
    // Validate dữ liệu từ client
    const { error } = validateAppointment(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const appointment = await Appointment.create(req.body);
    await Appointment_history.create({
      appointment_id: appointment._id,
    });
    if (appointment) {
      return res.status(200).json(appointment);
    }
    return res.status(400).json({ message: "Appointment not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const findAllAppointment = async (req, res) => {
  try {
    const appointments = await Appointment.find({});
    if (!appointments || appointments.length === 0) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    // Sắp xếp các cuộc hẹn theo createdAt từ mới nhất đến cũ nhất
    appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const appointmentsWithDetails = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });
        const patientInfo = await User.findOne({ _id: patient.user_id });
        const doctor = await Doctor.findOne({ _id: appointment.doctor_id });
        const doctorInfo = await User.findOne({ _id: doctor.user_id });

        return {
          ...appointment.toObject(),
          patientInfo,
          doctorInfo,
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

const findAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (appointment) {
      return res.status(200).json(appointment);
    }
    return res.status(400).json({ message: "Appointment not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
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
    const appointment = await Appointment.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" });
    }

    await Appointment_history.findOneAndUpdate(
      { appointment_id: appointment._id },
      {
        appointment_id: appointment._id,
      },
      { new: true }
    );

    await Notification.create({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      content: `Your appointment has been changed.`,
      new_date: appointment.work_date,
      new_work_shift: appointment.work_shift,
    });

    const patient = await Patient.findById(appointment.patient_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const doctor = await Doctor.findById(appointment.doctor_id);
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

    const vietnamTime = moment(appointment.work_date)
      .tz("Asia/Ho_Chi_Minh")
      .format("dddd, MMMM DD YYYY");

    const mailOptionsPatient = {
      from: process.env.EMAIL_USER,
      to: patientInfo.email,
      subject: "Notification Appointment",
      text: `Dear Patient, your appointment has been updated. \nNew date: ${vietnamTime}. \nTime: ${appointment.work_shift}.`,
    };

    const mailOptionsDoctor = {
      from: process.env.EMAIL_USER,
      to: doctorInfo.email,
      subject: "Notification Appointment",
      text: `Dear Doctor, your appointment with patient has been updated. \nNew date: ${vietnamTime}. \nTime: ${appointment.work_shift}.`,
    };

    // Gửi email
    await transporter.sendMail(mailOptionsPatient);
    await transporter.sendMail(mailOptionsDoctor);

    const appointmentUpdate = await Appointment.findById(id);
    return res.status(200).json(appointmentUpdate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(400).json({ message: "Appointment not found" });
    }
    await Appointment.findByIdAndDelete(id);
    await Appointment_history.findOneAndDelete({
      appointment_id: appointment._id,
    });
    return res.status(200).json({ message: "Delete appointment success!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const patientCreateAppointment = async (req, res) => {
  try {
    const patient = await Patient.findOne({ user_id: req.user.id });
    if (!patient) {
      return res.status(400).json({ message: "Patient not found" });
    }
    const appointment = await Appointment.create({
      ...req.body,
      patient_id: patient._id,
    });
    await Appointment_history.create({
      appointment_id: appointment._id,
    });
    await Notification.create({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      content: `Bạn đã đặt lịch khám vào ngày: ${moment(
        appointment.work_date
      ).format("DD/MM/YYYY")}, hãy chờ phản hồi từ bác sĩ.`,
      new_date: appointment.work_date,
      new_work_shift: appointment.work_shift,
    });
    if (appointment) {
      return res.status(200).json(appointment);
    }
    return res.status(400).json({ message: "Appointment not found" });
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

      if (appointments.length > 0) {
        return res.status(200).json(appointments);
      }
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
        .sort({ updatedAt: -1 }); // Sắp xếp theo updatedAt giảm dần

      if (appointments.length > 0) {
        return res.status(200).json(appointments);
      }
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

    // Lấy thời gian hiện tại và thời gian hẹn
    const now = new Date();
    const appointmentDate = new Date(appointment.work_date); // Giả định work_date là trường lưu thời gian hẹn

    // Kiểm tra xem lịch hẹn có còn hơn 1 ngày nữa không
    const timeDifference = appointmentDate - now;
    const oneDayInMillis = 24 * 60 * 60 * 1000; // 1 ngày tính bằng milliseconds

    if (timeDifference <= oneDayInMillis) {
      return res.status(400).json({
        message: "You can only cancel appointments more than 1 day in advance.",
      });
    }

    // Xóa lịch hẹn và lịch sử
    await Appointment.findByIdAndDelete(id);
    await Appointment_history.findOneAndDelete({
      appointment_id: appointment._id,
    });

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

    const updatedAppointments = await Promise.all(
      upcomingAppointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });
        if (!patient) {
          throw new Error("Patient not found");
        }

        const user = await User.findOne({ _id: patient.user_id });
        if (!user) {
          throw new Error("User not found");
        }

        return {
          ...appointment.toObject(),
          patient_name: user.name,
        };
      })
    );

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

    const updatedAppointments = await Promise.all(
      appointments.map(async (appointment) => {
        const patient = await Patient.findOne({ _id: appointment.patient_id });
        if (!patient) {
          throw new Error("Patient not found");
        }

        const user = await User.findOne({ _id: patient.user_id });
        if (!user) {
          throw new Error("User not found");
        }

        return {
          ...appointment.toObject(),
          patient_name: user.name,
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

module.exports = {
  createAppointment,
  findAllAppointment,
  findAppointment,
  updateAppointment,
  deleteAppointment,
  patientCreateAppointment,
  getCurrentUserAppointments,
  processPrematureCancellation,
  showUpcomingAppointments,
  getAppointmentByStatus,
  countAppointmentDoctorDashboard,
  getUpcomingAppointmentsDashboardAdmin,
  getAllAppointmentAdmin
};
