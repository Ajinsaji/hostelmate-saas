const notificationService = require("../services/notificationCenterService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  const userId =
    req.owner?.ownerId ||
    req.owner?._id ||
    req.user?.userId ||
    req.user?.id ||
    req.user?._id ||
    req.admin?._id ||
    null;

  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId || null,
    userId,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const dispatchNotification = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const notification = await notificationService.dispatchNotification({
      hostelId: userCtx.hostelId,
      createdBy: userCtx.userId,
      ...req.body,
    });
    return res.status(201).json({ success: true, message: "Notification Dispatched", notification });
  } catch (err) {
    logger.error("dispatchNotification error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to dispatch notification" });
  }
};

const getNotifications = async (req, res) => {
  try {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    const userCtx = getUserContext(req);
    const result = await notificationService.getNotifications({
      hostelId: userCtx.hostelId,
      recipientId: userCtx.userId,
      unreadOnly: req.query.unreadOnly === "true",
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("getNotifications error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getUnreadCount = async (req, res) => {
  try {
    res.set("Cache-Control", "no-cache, no-store, must-revalidate");
    const userCtx = getUserContext(req);
    const count = await notificationService.getUnreadCount({
      hostelId: userCtx.hostelId,
      recipientId: userCtx.userId,
    });
    return res.status(200).json({ success: true, unreadCount: count });
  } catch (err) {
    logger.error("getUnreadCount error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(req.params.id);
    return res.status(200).json({ success: true, message: "Marked as Read", notification });
  } catch (err) {
    logger.error("markAsRead error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to mark as read" });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    await notificationService.markAllAsRead({
      hostelId: userCtx.hostelId,
      recipientId: userCtx.userId,
    });
    return res.status(200).json({ success: true, message: "All Notifications Marked as Read" });
  } catch (err) {
    logger.error("markAllAsRead error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to mark all as read" });
  }
};

const getNotificationSettings = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const NotificationSetting = require("../models/NotificationSetting");
    let settings = await NotificationSetting.findOne({ userId: userCtx.userId });

    if (!settings) {
      settings = await NotificationSetting.create({
        userId: userCtx.userId,
        hostelId: userCtx.hostelId || null,
        role: req.owner ? "owner" : req.user?.role || "user",
        pushNotifications: true,
        whatsappNotifications: true,
        browserNotifications: true,
        emailNotifications: false,
        smsNotifications: false,
        categories: {
          payments: true,
          admissions: true,
          residents: true,
          rooms: true,
          staff: true,
          subscription: true,
          complaints: true,
          reminders: true,
          system: true,
        },
      });
    }

    return res.status(200).json({ success: true, settings });
  } catch (err) {
    logger.error("getNotificationSettings error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to load notification settings" });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const NotificationSetting = require("../models/NotificationSetting");
    const {
      pushNotifications,
      whatsappNotifications,
      browserNotifications,
      categories = {},
    } = req.body;

    const updateDoc = {};
    if (typeof pushNotifications === "boolean") updateDoc.pushNotifications = pushNotifications;
    if (typeof whatsappNotifications === "boolean") updateDoc.whatsappNotifications = whatsappNotifications;
    if (typeof browserNotifications === "boolean") updateDoc.browserNotifications = browserNotifications;

    if (categories && typeof categories === "object") {
      Object.entries(categories).forEach(([catKey, catVal]) => {
        if (typeof catVal === "boolean") {
          updateDoc[`categories.${catKey}`] = catVal;
        }
      });
    }

    const settings = await NotificationSetting.findOneAndUpdate(
      { userId: userCtx.userId },
      { $set: updateDoc },
      { upsert: true, returnDocument: "after" }
    );

    return res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      settings,
    });
  } catch (err) {
    logger.error("updateNotificationSettings error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to update settings" });
  }
};

const registerDeviceToken = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const {
      token,
      platform = "web",
      deviceType = "mobile",
      deviceName = "Android / Mobile Device",
      browser = "Chrome",
      os = "Android",
    } = req.body;

    const mongoose = require("mongoose");
    if (!userCtx.userId || !mongoose.Types.ObjectId.isValid(userCtx.userId)) {
      return res.status(401).json({ success: false, message: "Valid authenticated identity required to register device token" });
    }

    if (!token || typeof token !== "string" || !token.trim()) {
      return res.status(400).json({ success: false, message: "A non-empty device token string is required" });
    }

    const canonicalUserId = new mongoose.Types.ObjectId(userCtx.userId);
    const trimmedToken = token.trim();
    const safeFingerprint = `${trimmedToken.slice(0, 8)}...`;
    const DeviceToken = require("../models/DeviceToken");

    // Audit existing token ownership
    const existing = await DeviceToken.findOne({ token: trimmedToken });
    if (existing && String(existing.userId) !== String(canonicalUserId)) {
      logger.info(`[FCM TOKEN REASSIGNMENT] Reassigning token ${safeFingerprint} from previous user ${existing.userId} to new user ${canonicalUserId}`);
    }

    const deviceToken = await DeviceToken.findOneAndUpdate(
      { token: trimmedToken },
      {
        userId: canonicalUserId,
        hostelId: userCtx.hostelId ? (mongoose.Types.ObjectId.isValid(userCtx.hostelId) ? new mongoose.Types.ObjectId(userCtx.hostelId) : null) : null,
        role: req.owner ? "owner" : req.user?.role || "user",
        platform: String(platform || "web"),
        deviceType: String(deviceType || "mobile"),
        deviceName: String(deviceName || "Android / Mobile Device"),
        browser: String(browser || "Chrome"),
        os: String(os || "Android"),
        ipAddress: userCtx.ip,
        isActive: true,
        lastSeenAt: new Date(),
      },
      { upsert: true, returnDocument: "after" }
    );

    logger.info(`[registerDeviceToken] Registered token ${safeFingerprint} for user ${canonicalUserId} (role: ${deviceToken.role})`);
    return res.status(200).json({
      success: true,
      message: "Device token registered successfully",
      platform: deviceToken.platform,
      safeFingerprint,
      lastSeenAt: deviceToken.lastSeenAt,
      deviceToken: {
        _id: deviceToken._id,
        userId: deviceToken.userId,
        platform: deviceToken.platform,
        isActive: deviceToken.isActive,
        safeFingerprint,
        lastSeenAt: deviceToken.lastSeenAt,
      },
    });
  } catch (err) {
    logger.error("registerDeviceToken error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to register device token" });
  }
};

const getUserDevices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const DeviceToken = require("../models/DeviceToken");
    const devices = await DeviceToken.find({ userId: userCtx.userId, isActive: true })
      .select("_id platform deviceType deviceName browser os lastSeenAt createdAt")
      .sort({ lastSeenAt: -1 })
      .lean();

    return res.status(200).json({ success: true, devices });
  } catch (err) {
    logger.error("getUserDevices error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to fetch devices" });
  }
};

const deleteDeviceToken = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const DeviceToken = require("../models/DeviceToken");
    const { id } = req.params;
    const { token } = req.body || {};

    const query = { userId: userCtx.userId };
    if (id && id !== "current") {
      query._id = id;
    } else if (token) {
      query.token = token;
    }

    const result = await DeviceToken.findOneAndDelete(query);
    return res.status(200).json({
      success: true,
      message: result ? "Device removed successfully" : "Device not found or already removed",
    });
  } catch (err) {
    logger.error("deleteDeviceToken error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to remove device" });
  }
};

// In-memory rate limiting for test notifications (1 test per 30s per user)
const testNotificationTimers = new Map();

const sendTestNotification = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    if (!userCtx.userId) {
      return res.status(401).json({ success: false, reason: "UNAUTHENTICATED", message: "Authentication required" });
    }

    const userIdStr = String(userCtx.userId);
    const now = Date.now();
    const lastSent = testNotificationTimers.get(userIdStr) || 0;
    if (now - lastSent < 30000) {
      const waitSec = Math.ceil((30000 - (now - lastSent)) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before sending another test notification.`,
      });
    }

    const DeviceToken = require("../models/DeviceToken");
    const devTokens = await DeviceToken.find({ userId: userCtx.userId, isActive: true })
      .select("token");

    const targetTokens = devTokens.map((t) => t.token);

    if (!targetTokens.length) {
      return res.status(400).json({
        success: false,
        reason: "NO_ACTIVE_DEVICE_TOKENS",
        message: "No registered push device tokens found for this account. Please enable notifications first.",
      });
    }

    testNotificationTimers.set(userIdStr, now);

    const { sendPushToUserDevices } = require("../utils/fcmService");
    const pushResult = await sendPushToUserDevices({
      userId: userCtx.userId,
      hostelId: userCtx.hostelId,
      title: "HostelMate Notifications",
      body: "Push notifications are working on this device.",
      data: {
        tokens: targetTokens,
        payload: {
          type: "test_notification",
          route: "/notifications",
        },
      },
    });

    const successCount = pushResult?.successCount || 0;
    const failureCount = pushResult?.failureCount || 0;

    if (!pushResult.success || successCount === 0) {
      return res.status(502).json({
        success: false,
        tokenCount: targetTokens.length,
        successCount: 0,
        failureCount: failureCount || targetTokens.length,
        reason: "FIREBASE_DELIVERY_FAILED",
        message: `Firebase rejected all target device tokens (${targetTokens.length} device(s)).`,
        pushResult,
      });
    }

    return res.status(200).json({
      success: true,
      tokenCount: targetTokens.length,
      successCount,
      failureCount,
      message: `Firebase accepted ${successCount}/${targetTokens.length} device(s).`,
      pushResult,
    });
  } catch (err) {
    logger.error("sendTestNotification error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to send test notification" });
  }
};

module.exports = {
  dispatchNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  registerDeviceToken,
  getUserDevices,
  deleteDeviceToken,
  sendTestNotification,
};

