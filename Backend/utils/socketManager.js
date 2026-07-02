const jwt = require("jsonwebtoken");
const Notification = require("../models/Notification");

let io = null;

const getBearerToken = (headers = {}) => {
  const authHeader = headers.authorization || headers.Authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
};

function setSocketServer(server) {
  if (!server) return;
  const { Server } = require("socket.io");
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || getBearerToken(socket.handshake.headers);
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const secret = process.env.JWT_SECRET || "change_me_secret";
      const payload = jwt.verify(token, secret);
      if (!payload || (!payload.userId && !payload.ownerId)) {
        return next(new Error("Invalid token payload"));
      }

      socket.user = {
        userId: payload.userId || payload.ownerId,
        role: payload.role,
        hostelId: payload.hostelId || null,
      };
      return next();
    } catch (error) {
      return next(new Error("Invalid/expired token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user?.userId;
    if (userId) {
      socket.join(`user_${userId}`);
    }

    socket.on("disconnect", () => {
      // no-op
    });
  });
}

async function emitNotificationToUser({ userId, notification }) {
  if (!io || !userId || !notification) return;

  try {
    const query = { userId, isRead: false };
    if (notification.hostelId) query.hostelId = notification.hostelId;
    const unreadCount = await Notification.countDocuments(query);
    io.to(`user_${userId}`).emit("notification:new", {
      notification,
      unreadCount,
    });
  } catch (e) {
    console.error("emitNotificationToUser error:", e?.message || e);
  }
}

module.exports = {
  setSocketServer,
  emitNotificationToUser,
};
