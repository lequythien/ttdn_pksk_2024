require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
const upload = require("./helpers/multer-config");
const session = require("express-session");
const cron = require("node-cron");
const sendAppointmentReminders = require("./services/index");
const createWebSocketServer = require('./helpers/websocket-config');

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
const SESSION_SECRET = process.env.SESSION_SECRET;

const userRouterRole = require("./routers/Role");
const userRouterDoctor = require("./routers/Doctor");
const userRouterPatient = require("./routers/Patient");
const userRouterSpecialization = require("./routers/Specialization");
const userRouterNotification = require("./routers/Notification");
const userRouterAppointment = require("./routers/Appointment");
const userRouterSchedule = require("./routers/Schedule");
const userRouterHome = require("./routers/Home");

// Middleware
const cors = require("cors");

// Middleware
const app = express();

// Cấu hình CORS
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
};

// Sử dụng middleware CORS với các tùy chọn
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware để thêm header COOP
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "same-origin");
  next();
});

// Cron job
// cron.schedule("* * * * *", async () => {
cron.schedule("* 7 * * *", async () => {
  try {
    await sendAppointmentReminders();
    console.log("Email reminders triggered successfully.");
  } catch (error) {
    console.error("Error triggering email reminders:", error);
  }
});

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

// Database connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Mongodb is connected."))
  .catch((e) => console.log(e));

// Session
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// User routes
app.use("/role", userRouterRole);
app.use("/doctor", userRouterDoctor);
app.use("/patient", userRouterPatient);
app.use("/specialization", userRouterSpecialization);
app.use("/notification", userRouterNotification);
app.use("/appointment", userRouterAppointment);
app.use("/schedule", userRouterSchedule);
app.use("/", userRouterHome);

// Route default
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// Cloudinary configuration
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

// Express route for image upload
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "doctor",
    });
    res.json({ imageUrl: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uploading image to Cloudinary" });
  }
});

// Khởi động server
const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

// Khởi động WebSocket server
createWebSocketServer(server);
