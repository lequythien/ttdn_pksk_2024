const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Notification = require("../models/Notification");
const transporter = require("../helpers/mailer-config");
const moment = require("moment");
require("moment/locale/vi");

const sendAppointmentReminders = async () => {
  try {
    const now = moment();
    const next24Hours = moment().add(24, 'hours');

    // Tìm tất cả các cuộc hẹn trong 24 giờ tới
    const upcomingAppointments = await Appointment.find({
      work_date: { $gte: now.toDate(), $lt: next24Hours.toDate() },
      status: "confirmed",
    })
      .populate("patient_id")
      .populate("doctor_id");

    for (const appointment of upcomingAppointments) {
      const patient = await User.findById(appointment.patient_id.user_id);
      const doctor = await User.findById(appointment.doctor_id.user_id);

      moment.locale('vi');

      const vietnamTime = moment.utc(appointment.work_date)
        .tz("Asia/Ho_Chi_Minh")
        .format("dddd, DD-MM-YYYY");

      // Chuyển chữ cái đầu tiên của ngày thành chữ in hoa
      const formattedVietnamTime = vietnamTime.charAt(0).toUpperCase() + vietnamTime.slice(1);

      const workShiftText = appointment.work_shift === "morning" ? "Sáng" : "Chiều";

      console.log(
        appointment.patient_id._id, "-", appointment.doctor_id._id, "-", appointment._id,
      )
      // Tạo thông báo cho bệnh nhân
      const notificationPatient = await Notification.create({
        patient_id: appointment.patient_id._id,
        doctor_id: appointment.doctor_id._id,
        content: `Nhắc nhở: Cuộc hẹn của bạn vào ngày ${formattedVietnamTime} - Ca khám: ${workShiftText}.`,
        appointment_id: appointment._id,
        isRead: false,
        recipientType: 'patient',
      });

      if (!notificationPatient) {
        console.log("Failed to create notification for patient");
        return;
      }

      // Tạo thông báo cho bác sĩ
      await Notification.create({
        patient_id: appointment.patient_id._id,
        doctor_id: appointment.doctor_id._id,
        content: `Nhắc nhở: Cuộc hẹn với bệnh nhân ${patient.name} vào ngày ${formattedVietnamTime} - Ca khám: ${workShiftText}.`,
        appointment_id: appointment._id,
        isRead: false,
        recipientType: 'doctor',
      });

      // Gửi email cho bệnh nhân và bác sĩ
      const mailOptionsPatient = {
        from: process.env.EMAIL_USER,
        to: patient.email,
        subject: "Nhắc nhở: Cuộc hẹn sắp tới",
        text: `Xin chào ${patient.name},\n\nĐây là lời nhắc nhở cho cuộc hẹn sắp tới của bạn vào ngày ${formattedVietnamTime} - Ca khám: ${workShiftText}.\n\nTrân trọng!`,
      };

      const mailOptionsDoctor = {
        from: process.env.EMAIL_USER,
        to: doctor.email,
        subject: "Nhắc nhở: Cuộc hẹn sắp tới",
        text: `Xin chào ${doctor.name},\n\nĐây là lời nhắc nhở cho cuộc hẹn sắp tới của bạn với bệnh nhân ${patient.name} vào ngày ${formattedVietnamTime} - Ca khám: ${workShiftText}.\n\nTrân trọng!`,
      };

      // Gửi email
      await Promise.all([
        transporter.sendMail(mailOptionsPatient),
        transporter.sendMail(mailOptionsDoctor),
      ]);
    }

    // Kiểm tra lịch làm việc của bác sĩ
    const upcomingDoctorWork = await Appointment.find({
      doctor_id: { $exists: true }, // Kiểm tra bác sĩ có lịch làm việc
      work_date: { $gte: now.toDate(), $lt: next24Hours.toDate() },
      status: "confirmed",
    }).populate("doctor_id");

    for (const work of upcomingDoctorWork) {
      const doctor = await User.findById(work.doctor_id.user_id);

      // Tạo thông báo cho bác sĩ về lịch làm việc sắp tới
      await Notification.create({
        doctor_id: work.doctor_id._id,
        content: `Nhắc nhở: Lịch làm việc của bạn vào ngày ${formattedVietnamTime} - Ca khám với bệnh nhân ${work.patient_id.name}.`,
        appointment_id: work._id,
        isRead: false,
        recipientType: 'doctor',
      });
    }
  } catch (error) {
    console.error("Lỗi khi gửi nhắc nhở cuộc hẹn:", error);
  }
};

module.exports = sendAppointmentReminders;

