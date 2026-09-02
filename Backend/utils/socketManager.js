const { logger } = require('./logger');
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

  // Socket authentication middleware — userId resolved from verified JWT only.
  // We never trust socket.handshake.query.userId or any frontend-supplied identity.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || getBearerToken(socket.handshake.headers);
      if (!token) {
        return next(new Error("Authentication token required"));
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return next(new Error("Server misconfigured: JWT_SECRET missing"));
      }
      const payload = jwt.verify(token, secret);
      if (!payload || (!payload.userId && !payload.ownerId)) {
        return next(new Error("Invalid token payload"));
      }

      // userId is the single canonical identity used for room assignment
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
      // User-specific room — all notifications for this user are emitted here
      socket.join(`user_${userId}`);
      logger.info(`[SOCKET CONNECTED] userId=${userId} socketId=${socket.id} room=user_${userId}`);
    }

    socket.on("disconnect", () => {
      // Room membership is cleaned up automatically by Socket.IO on disconnect
    });
  });
}

/**
 * Emit a new notification to a specific user's socket room.
 *
 * SECURITY INVARIANT:
 *   - userId is the authoritative recipient identity
 *   - Emits ONLY to `user_${userId}` — never broadcasts to all clients
 *   - Unread count is scoped to this userId using readAt:null (schema-accurate)
 *
 * @param {string|ObjectId} userId — canonical recipient (Notification.userId)
 * @param {object} notification   — the saved Notification document
 */
async function emitNotificationToUser({ userId, notification }) {
  if (!io || !userId || !notification) return;

  try {
    // Unread count scoped strictly to this user.
    // readAt: null is the schema-accurate "unread" sentinel (not isRead, not status).
    // $or covers both canonical userId field and legacy recipientId (migration compat).
    const unreadCount = await Notification.countDocuments({
      $or: [
        { userId },
        { recipientId: userId },
      ],
      readAt: null,
    });

    const room = `user_${userId}`;
    io.to(room).emit("notification:new", {
      notification,
      unreadCount,
    });

    logger.info(
      `[NOTIFICATION SOCKET EMIT] recipientUserId=${userId} ` +
      `notificationId=${notification._id} room=${room} unreadCount=${unreadCount}`
    );
  } catch (e) {
    logger.error("emitNotificationToUser error:", e?.message || e);
  }
}

module.exports = {
  setSocketServer,
  emitNotificationToUser,
};
