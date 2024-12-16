const Specialization = require("../../models/Specialization");
const Notification = require("../../models/Notification");
const Doctor = require("../../models/Doctor");
const Patient = require("../../models/Patient");
const Appointment = require("../../models/Appointment");
const Appointment_history = require("../../models/Appointment_history");
const Payment = require("../../models/Payment");
const Schedule = require("../../models/Schedule");

const createNotification = async (req, res) => {
  try {
    const notification = await Notification.create(req.body);
    if (notification) {
      return res.status(200).json(notification);
    }
    return res.status(400).json({ message: "Notification not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const findAllNotification = async (req, res) => {
  try {
    // Lấy tất cả thông báo
    const notifications = await Notification.find({});

    if (notifications.length > 0) {
      // Lấy danh sách ID của các cuộc hẹn từ notifications
      const appointmentIds = notifications.map(
        (notification) => notification.appointment_id
      );

      // Tìm tất cả các cuộc hẹn tương ứng
      const appointments = await Appointment.find({
        _id: { $in: appointmentIds },
      });

      // Kết hợp dữ liệu thông báo và thông tin cuộc hẹn
      const notificationsWithDetails = notifications.map((notification) => {
        const appointment = appointments.find(
          (app) => app._id.toString() === notification.appointment_id.toString()
        );

        return {
          ...notification.toObject(), // Chuyển đổi notification thành object
          work_date: appointment ? appointment.work_date : null, // Thêm work_date
          work_shift: appointment ? appointment.work_shift : null, // Thêm work_shift
        };
      });

      return res.status(200).json(notificationsWithDetails);
    }

    return res.status(400).json({ message: "Notification not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const findNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (notification) {
      return res.status(200).json(notification);
    }
    return res.status(400).json({ message: "Notification not found" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, req.body);
    if (!notification) {
      return res.status(400).json({ message: "Notification not found" });
    }
    const notificationUpdate = await Notification.findById(id);
    return res.status(200).json(notificationUpdate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(400).json({ message: "Notification not found" });
    }
    await Notification.findByIdAndDelete(id);
    return res.status(200).json({ message: "Delete notification success!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getCurrentUserNotifications = async (req, res) => {
  try {
    const {id} = req.params;

      const patient = await Patient.findOne({ user_id: id });
      if (!patient) {
        return res.status(400).json({ message: "Patient not found" });
      }

      const notifications = await Notification.find({
        patient_id: patient._id,
        recipientType: "patient",
      }).sort({ createdAt: -1 });

      if (notifications.length > 0) {
        return res.status(200).json({success: true, data: notifications});
      }
      return res.status(404).json({success: false, message: "Notifications not found" });
  } catch (error) {
    return res.status(500).json({success: false, message: error.message });
  }
};

const deleteAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({});
    return res
      .status(200)
      .json({success: true, message: "All notifications deleted successfully!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const readNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(400).json({ message: "Notification not found" });
    }
    notification.isRead = true;
    await notification.save();
    return res.status(200).json({ message: "Notification read successfully!" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const getNotificationByDoctorDahsboard = async (req, res) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({ user_id: id });
    if (!doctor) {
      return res
        .status(400)
        .json({ success: false, message: "Doctor not found" });
    }
    const notifications = await Notification.find({ doctor_id: doctor._id, recipientType: "doctor" });

    if (notifications.length > 0) {
      const appointmentIds = notifications.map(
        (notification) => notification.appointment_id
      );

      const appointments = await Appointment.find({
        _id: { $in: appointmentIds },
      });

      const notificationsWithDetails = notifications.map((notification) => {
        const appointment = appointments.find(
          (app) => app._id.toString() === notification.appointment_id.toString()
        );

        return {
          ...notification.toObject(), // Chuyển đổi notification thành object
          work_date: appointment ? appointment.work_date : null, // Thêm work_date
          work_shift: appointment ? appointment.work_shift : null, // Thêm work_shift
        };
      });

      return res.status(200).json(notificationsWithDetails);
    }

    return res.status(400).json({ message: "Notification not found" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createNotification,
  findAllNotification,
  findNotification,
  updateNotification,
  deleteNotification,
  getCurrentUserNotifications,
  deleteAllNotifications,
  readNotification,
  getNotificationByDoctorDahsboard,
};
