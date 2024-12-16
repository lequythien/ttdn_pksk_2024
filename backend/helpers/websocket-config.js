const WebSocket = require("ws");
const {
  getCurrentUserNotifications,
} = require("../controllers/NotificationController/index");
const Patient = require("../models/Patient");
const Notification = require("../models/Notification");

const createWebSocketServer = (httpServer) => {
  const wss = new WebSocket.Server({ noServer: true });
  const clients = new Map(); // Lưu trữ user_id tương ứng với WebSocket client

  wss.on("connection", (ws, req) => {
    console.log("Client connected");

    ws.on("message", async (message) => {

      const parsedMessage = JSON.parse(message);
      const { user_id, action } = parsedMessage;

      if (!user_id) {
        return ws.send(
          JSON.stringify({ success: false, message: "User ID is required" })
        );
      }

      // Lưu client và user_id để gửi thông báo real-time
      clients.set(user_id, ws);

      // Gửi thông báo chưa đọc cho client
      const sendUnreadNotifications = async () => {
        try {
          const patient = await Patient.findOne({ user_id });
          if (!patient) {
            return ws.send(
              JSON.stringify({ success: false, message: "Patient not found" })
            );
          }

          const notifications = await Notification.find({
            patient_id: patient._id,
            recipientType: "patient",
          }).sort({ createdAt: -1 });

          const unreadNotifications = notifications.filter((n) => !n.isRead);
          ws.send(
            JSON.stringify({
              success: true,
              unreadCount: unreadNotifications.length,
              notifications: unreadNotifications,
            })
          );
        } catch (error) {
          console.error("Error fetching notifications:", error);
          ws.send(JSON.stringify({ success: false, message: error.message }));
        }
      };

      // Nếu client yêu cầu cập nhật thủ công
      if (action === "update") {
        await sendUnreadNotifications();
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      clients.forEach((clientWs, userId) => {
        if (clientWs === ws) clients.delete(userId);
      });
    });
  });

  // Theo dõi thay đổi trong collection Notification
  Notification.watch().on("change", async (change) => {
    try {
      const { operationType, fullDocument } = change;

      if (operationType === "insert" || operationType === "update") {
        const patientId = fullDocument.patient_id;
        const patient = await Patient.findById(patientId);
        if (patient) {
          const clientWs = clients.get(patient.user_id);
          if (clientWs && clientWs.readyState === WebSocket.OPEN) {
            const unreadNotifications = await Notification.find({
              patient_id: patientId,
              isRead: false,
            }).sort({ createdAt: -1 });

            clientWs.send(
              JSON.stringify({
                success: true,
                unreadCount: unreadNotifications.length,
                notifications: unreadNotifications,
              })
            );
          }
        }
      }
    } catch (error) {
      console.error("Error sending real-time notifications:", error);
    }
  });

  httpServer.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  return wss;
};

module.exports = createWebSocketServer;
