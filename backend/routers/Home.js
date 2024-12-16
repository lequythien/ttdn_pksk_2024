const express = require("express");
const router = express.Router();
const {
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
} = require("../controllers/HomeController/index");
const {
  patientCreateAppointment, 
  getCurrentUserAppointments,
  processPrematureCancellation,
  showUpcomingAppointments,
  getAppointmentByStatus,
  countAppointmentDoctorDashboard,
  getUpcomingAppointmentsDashboardAdmin
} = require("../controllers/AppointmentController/index");
const {profilePatient, updateProfilePatient} = require("../controllers/PatientController/index");
const userMiddleware = require("../middlewares/index");
const {
  getScheduleByDoctor
} = require("../controllers/ScheduleController/index");
const { getCurrentUserNotifications } = require("../controllers/NotificationController/index");
const {payment, callback, checkPaymentStatus} = require("../helpers/momo-config");


// Định nghĩa route
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/create-appointment/:id", patientCreateAppointment);
router.get("/profilePatient", userMiddleware, profilePatient);
router.post("/updateProfilePatient/:id", updateProfilePatient);
router.get("/user-appointment", userMiddleware, getCurrentUserAppointments);
router.put("/cancel-appointment/:id", processPrematureCancellation);
router.get("/show-upcoming-appointments/:id", showUpcomingAppointments);
router.get("/get-appointments-status/:id", getAppointmentByStatus);
router.get("/get-schedule-doctor/:id", getScheduleByDoctor);
router.get("/filter/:id", filter);
router.get("/notification/:id", getCurrentUserNotifications);
router.get("/medical-history/:id", getHistoryAppointment);
router.get("/get-data-doctor-dashboard/:id", countAppointmentDoctorDashboard);
router.get("/upcoming-appointments-dashboard-admin", getUpcomingAppointmentsDashboardAdmin);
router.post("/payment/:id", payment);
router.post("/callback", callback);
router.get("/check-payment-status/:id", checkPaymentStatus); 
router.get("/get-money-dashboard-admin", getdataMoneyDashboardAdmin); 
router.get("/get-all-schedule-doctor", getAllScheduleDoctor); 
router.post('/google-login', googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post("/send-email", contact);
router.get('/get-filtered-schedule-doctor', getFilteredScheduleDoctor);

module.exports = router;
