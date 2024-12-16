const Appointment = require("../../models/Appointment");
const Schedule = require("../../models/Schedule");
const Doctor = require("../../models/Doctor");
const validateSchedule = require("../../requests/validateSchedule");
const transporter = require("../../helpers/mailer-config");
const moment = require("moment");
const Patient = require("../../models/Patient");
const User = require("../../models/User");
const Notification = require("../../models/Notification");
require("moment/locale/vi");

const createSchedule = async (req, res) => {
  try {
    // Validate dữ liệu từ client
    const { error } = validateSchedule(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const schedule = await Schedule.create(req.body);
    if (schedule) {
      return res.status(200).json(schedule);
    }
    return res.status(400).json({ message: "Schedule not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const findAllSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.find({});
    if (schedule) {
      return res.status(200).json(schedule);
    }
    return res.status(400).json({ message: "Schedule not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const findSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    if (schedule) {
      return res.status(200).json(schedule);
    }
    return res.status(400).json({ message: "Schedule not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateSchedule = async (req, res) => {
  try {
    // Validate dữ liệu từ client
    const { error } = validateSchedule(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { id } = req.params;
    const schedule = await Schedule.findByIdAndUpdate(id, req.body);
    if (!schedule) {
      return res.status(400).json({ message: "Schedule not found" });
    }
    const scheduleUpdate = await Schedule.findById(id);
    return res.status(200).json(scheduleUpdate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res
        .status(400)
        .json({ success: false, message: "Schedule not found" });
    }

    const doctor = await Doctor.findById(schedule.doctor_id);
    if (!doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not found" });
    }

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      work_date: schedule.work_date,
      work_shift: schedule.work_shift, 
      status: "confirmed",
    });
    if (appointments.length > 0) {
      return res
        .status(400)
        .json({ success: false, message: "Không thể xoá lịch làm việc khi có lịch hẹn!" });
    }

    const now = new Date();
    const workDate = new Date(schedule.work_date);
    // Tính toán thời gian còn lại đến lịch làm việc
    const timeDifference = workDate - now;

    // Kiểm tra nếu thời gian còn lại lớn hơn 24 giờ
    if (timeDifference > 24 * 60 * 60 * 1000) {
      // Xóa lịch làm việc
      await Schedule.findByIdAndDelete(id);
      return res
        .status(200)
        .json({ success: true, message: "Delete schedule success!" });
    }

    return res.status(400).json({
      success: false,
      message:
        "Bạn không thể xoá lịch làm việc trong vòng 24h trước khi diễn ra!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getScheduleByDoctor = async (req, res) => {
  try {
    const { id } = req.params;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const doctor = await Doctor.findOne({ _id: id });
    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    const schedules = await Schedule.find({
      doctor_id: doctor._id,
      work_date: { $gte: today },
    }).sort({ work_date: 1 });

    if (schedules.length <= 0) {
      return res.status(400).json({ message: "Schedule not found" });
    }

    // Thêm trường available từ doctor vào từng lịch
    const schedulesWithAvailability = schedules.map(schedule => ({
      ...schedule.toObject(), // Chuyển đổi Mongoose Document thành Object
      available: doctor.available // Lấy trường available từ doctor
    }));

    return res.status(200).json(schedulesWithAvailability);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};


const getScheduleByDoctorDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    const doctor = await Doctor.findOne({ user_id: id });
    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }
    const schedules = await Schedule.find({
      doctor_id: doctor._id,
      // work_date: { $gte: today },
    }).sort({ work_date: 1 });
    if (schedules.length <= 0) {
      return res.status(400).json({ message: "Schedule not found" });
    }
    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const doctorCreateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { work_shift, work_date } = req.body;

    const doctor = await Doctor.findOne({ user_id: id });
    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    // Lấy thời gian hiện tại
    const currentDateTime = new Date();
    const scheduleDateTime = new Date(work_date);

    // Thiết lập thời gian cho các ca làm việc
    if (work_shift === "morning") {
      scheduleDateTime.setHours(7, 30, 0, 0); // 7h30
    } else if (work_shift === "afternoon") {
      scheduleDateTime.setHours(13, 30, 0, 0); // 13h30
    }

    // Kiểm tra thời gian hiện tại với thời gian tạo lịch
    if (work_shift === "morning" && currentDateTime > new Date(scheduleDateTime.getTime() - 30 * 60 * 1000)) {
      return res.status(400).json({
        message: "Không thể tạo lịch cho ca sáng sau 7h30!",
      });
    } else if (work_shift === "afternoon" && currentDateTime > new Date(scheduleDateTime.getTime() - 30 * 60 * 1000)) {
      return res.status(400).json({
        message: "Không thể tạo lịch cho ca chiều sau 13h30!",
      });
    }

    const checkSchedule = await Schedule.findOne({
      work_date: req.body.work_date,
      work_shift: req.body.work_shift,
      doctor_id: doctor._id,
    });
    if (checkSchedule) {
      return res.status(400).json({ message: "Lịch làm việc đã tồn tại." });
    }

    const schedule = await Schedule.create({
      ...req.body,
      doctor_id: doctor._id,
    });
    if (schedule) {
      return res.status(200).json({ success: true, schedule });
    }
    return res
      .status(400)
      .json({ success: false, message: "Schedule not found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res
        .status(400)
        .json({ success: false, message: "Schedule not found" });
    }
    return res.status(200).json({ success: true, schedule });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const doctorUpdateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.body.id;
    const doctor = await Doctor.findOne({ user_id });

    if (!doctor) {
      return res.status(400).json({ message: "Doctor not found" });
    }

    const findSchedule = await Schedule.findById(id);

    if (!findSchedule) {
      return res
        .status(400)
        .json({ success: false, message: "Schedule not found" });
    }

    const now = new Date();
    const workDate = new Date(findSchedule.work_date);

    if (workDate <= now) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot update past schedules" });
    }

    const timeDifference = workDate - now;
    if (timeDifference <= 24 * 60 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot update schedule less than 24 hours before the appointment!",
      });
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(
      id,
      { ...req.body, doctor_id: doctor._id },
      { new: true }
    );

    if (!updatedSchedule) {
      return res
        .status(400)
        .json({ success: false, message: "Failed to update schedule" });
    }

    const appointments = await Appointment.find({
      doctor_id: doctor._id,
      work_date: findSchedule.work_date,
      work_shift: findSchedule.work_shift,
    });

    if (appointments.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No appointments found!" });
    }

    await Appointment.updateMany(
      {
        doctor_id: doctor._id,
        work_date: findSchedule.work_date,
        work_shift: findSchedule.work_shift,
      },
      {
        work_date: updatedSchedule.work_date,
        work_shift: updatedSchedule.work_shift,
      }
    );

    for (const appointment of appointments) {
      const patient = await Patient.findById(appointment.patient_id);
      if (!patient) {
        console.error(`Patient not found: ${appointment.patient_id}`);
        continue;
      }

      const userInfo = await User.findById(patient.user_id);
      if (!userInfo) {
        console.error(`User info not found for patient: ${patient.user_id}`);
        continue;
      }

      const formattedOldDate = formatVietnameseDate(findSchedule.work_date);
      const formattedNewDate = formatVietnameseDate(updatedSchedule.work_date);
      const oldShift = findSchedule.work_shift === "morning" ? "Sáng" : "Chiều";
      const newShift =
        updatedSchedule.work_shift === "morning" ? "Sáng" : "Chiều";
      const time = updatedSchedule.work_shift === "morning" ? "7h30-11h30" : "13h30-17h30";

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userInfo.email,
        subject: "Lịch hẹn thay đổi từ bác sĩ",
        text: `Xin chào ${userInfo.name},\n\nLịch hẹn của bạn vào ngày ${formattedOldDate} - Ca khám: ${oldShift} đã thay đổi thành ngày ${formattedNewDate} - Ca khám: ${newShift}.\n\nThời gian diễn ra: ${time}.\n\nTrân trọng!`,
      };

      try {
        await transporter.sendMail(mailOptions);
        await Notification.create({
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          message: `Lịch hẹn của bản thay đổi từ ngày ${formattedOldDate} - Ca khám: ${oldShift} thành ngày ${formattedNewDate} - Ca khám: ${newShift}.Thời gian diễn ra: ${time}.`,
          appointment_id: appointment._id,
          recipientType: "patient",
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${userInfo.email}:`, emailError);
      }
    }

    return res.status(200).json({ success: true, schedule: updatedSchedule });
  } catch (error) {
    console.error("Error in updating schedule:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Helper function to format Vietnamese dates
const formatVietnameseDate = (date) => {
  moment.locale("vi");
  const formattedDate = moment
    .utc(date)
    .tz("Asia/Ho_Chi_Minh")
    .format("dddd, DD-MM-YYYY");
  return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
};

module.exports = {
  createSchedule,
  findAllSchedule,
  findSchedule,
  updateSchedule,
  deleteSchedule,
  getScheduleByDoctor,
  doctorCreateSchedule,
  doctorUpdateSchedule,
  getSchedule,
  getScheduleByDoctorDashboard,
};
