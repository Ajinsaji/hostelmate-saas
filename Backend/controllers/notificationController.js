const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const { getMessaging } = require("../utils/firebaseAdmin");
const { sendPushToUserDevices } = require("../utils/fcmService");

// store/refresh token
const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform, role, hostelId } = req.body || {};
    const userId = req.owner?.ownerId;

    if (!token) {
      return res.status(400).json({ success: false, message: "token is required" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const hostId = hostelId || req.owner?.hostelId || null;
    const r = role || req.owner?.role || "owner";

    await DeviceToken.findOneAndUpdate(
      { token },
      {
        $set: {
          userId,
          role: r,
          hostelId: hostId,
          platform: platform || "web",
          isActive: true,
          lastSeenAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: "Device token registered" });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Failed to register token", error: e?.message });
  }
};

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.owner?.ownerId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { limit } = req.query;
    const pageLimit = Math.min(Number(limit || 20), 50);

    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(pageLimit);

    res.status(200).json({ success: true, notifications });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: e?.message });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.owner?.ownerId;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const count = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ success: true, unreadCount: count || 0 });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch unread count", error: e?.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.owner?.ownerId;
    const { notificationId } = req.params;

    const updated = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    res.status(200).json({ success: true, notification: updated });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to mark read", error: e?.message });
  }
};

module.exports = {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
};

