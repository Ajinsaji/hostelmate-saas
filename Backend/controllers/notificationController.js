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
      deviceId: rawDeviceId,
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
    const resolvedDeviceId = String(rawDeviceId || req.headers["x-device-id"] || `dev_${canonicalUserId.toString().slice(0, 8)}_${trimmedToken.slice(0, 8)}`).trim();
    const deviceIdFingerprint = `${resolvedDeviceId.slice(0, 8)}...`;
    const resolvedRole = req.owner ? "owner" : req.user?.role || "user";
    const DeviceToken = require("../models/DeviceToken");

    logger.info(`[DEVICE REGISTER] authenticatedUserId=${canonicalUserId} role=${resolvedRole} deviceId=${deviceIdFingerprint} tokenFingerprint=${safeFingerprint} platform=${platform} isActive=true`);

    // Audit token reassignment: if this FCM token was linked to another user, remove old ownership
    const existingSameToken = await DeviceToken.find({ token: trimmedToken });
    for (const doc of existingSameToken) {
      if (String(doc.userId) !== String(canonicalUserId)) {
        logger.info(`[FCM TOKEN REASSIGNMENT] oldUserId=${doc.userId} newUserId=${canonicalUserId} deviceId=${resolvedDeviceId} tokenFingerprint=${safeFingerprint} reason=user_login_switch`);
        await DeviceToken.deleteOne({ _id: doc._id }).catch(() => {});
      }
    }

    // Upsert device document by (userId, deviceId) to enforce 1 active record per device per user
    const deviceToken = await DeviceToken.findOneAndUpdate(
      { userId: canonicalUserId, deviceId: resolvedDeviceId },
      {
        userId: canonicalUserId,
        deviceId: resolvedDeviceId,
        hostelId: userCtx.hostelId ? (mongoose.Types.ObjectId.isValid(userCtx.hostelId) ? new mongoose.Types.ObjectId(userCtx.hostelId) : null) : null,
        role: resolvedRole,
        token: trimmedToken,
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

    // Enforce DB cleanup: delete any duplicate documents with identical token string for other device IDs
    await DeviceToken.deleteMany({
      token: trimmedToken,
      _id: { $ne: deviceToken._id },
    }).catch(() => {});

    logger.info(`[DEVICE UPDATED] userId=${deviceToken.userId} deviceId=${deviceToken.deviceId} tokenFingerprint=${safeFingerprint} isActive=${deviceToken.isActive}`);
    logger.info(`[FCM TOKEN REGISTERED] userId=${deviceToken.userId} deviceTokenId=${deviceToken._id} tokenFingerprint=${safeFingerprint} isActive=${deviceToken.isActive}`);

    // Post-login pending notification push delivery (Scenario 1 & 2 resolution)
    try {
      const Notification = require("../models/Notification");
      const pendingNotifs = await Notification.find({
        $or: [{ userId: canonicalUserId }, { recipientId: canonicalUserId }],
        isProcessedForPush: { $ne: true },
      }).lean();

      if (pendingNotifs.length > 0) {
        logger.info(`[FCM POST-LOGIN PENDING PUSH] Found ${pendingNotifs.length} pending notification(s) for user ${canonicalUserId}`);
        const { sendPushToUserDevices } = require("../utils/fcmService");

        for (const notif of pendingNotifs) {
          await sendPushToUserDevices({
            userId: canonicalUserId,
            hostelId: notif.hostelId,
            title: notif.title || "HostelMate",
            body: notif.message,
            data: {
              tokens: [trimmedToken],
              payload: {
                type: notif.type,
                notificationId: String(notif._id),
                route: notif.actionUrl || notif.meta?.route || "",
              },
            },
          });

          await Notification.updateOne(
            { _id: notif._id },
            { $set: { isProcessedForPush: true, pushDeliveredAt: new Date() } }
          );
          logger.info(`[FCM POST-LOGIN PENDING PUSH] Delivered pending notification ${notif._id} (${notif.type}) to newly registered token ${safeFingerprint} for user ${canonicalUserId}`);
        }
      }
    } catch (pendingErr) {
      logger.error("[FCM POST-LOGIN PENDING PUSH] Error delivering pending notifications:", pendingErr?.message || pendingErr);
    }
    return res.status(200).json({
      success: true,
      message: "Device token registered successfully",
      platform: deviceToken.platform,
      safeFingerprint,
      deviceId: deviceToken.deviceId,
      lastSeenAt: deviceToken.lastSeenAt,
      deviceToken: {
        _id: deviceToken._id,
        userId: deviceToken.userId,
        deviceId: deviceToken.deviceId,
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

const logoutCurrentDevice = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const mongoose = require("mongoose");
    if (!userCtx.userId || !mongoose.Types.ObjectId.isValid(userCtx.userId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { deviceId: bodyDeviceId, token } = req.body || {};
    const deviceId = String(bodyDeviceId || req.headers["x-device-id"] || "").trim();
    const DeviceToken = require("../models/DeviceToken");
    const canonicalUserId = new mongoose.Types.ObjectId(userCtx.userId);

    const query = { userId: canonicalUserId };
    if (deviceId) {
      query.deviceId = deviceId;
    } else if (token) {
      query.token = token.trim();
    }

    const result = await DeviceToken.findOneAndUpdate(
      query,
      { $set: { isActive: false, lastSeenAt: new Date() } },
      { returnDocument: "after" }
    );

    logger.info(`[FCM DEVICE DEACTIVATED] userId=${canonicalUserId} deviceId=${deviceId || result?.deviceId || "unknown"}`);

    return res.status(200).json({
      success: true,
      message: "Device logged out successfully",
      deviceId: result?.deviceId || deviceId || null,
      isActive: false,
    });
  } catch (err) {
    logger.error("logoutCurrentDevice error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to logout device" });
  }
};

const logoutAllDevices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const mongoose = require("mongoose");
    if (!userCtx.userId || !mongoose.Types.ObjectId.isValid(userCtx.userId)) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const DeviceToken = require("../models/DeviceToken");
    const canonicalUserId = new mongoose.Types.ObjectId(userCtx.userId);

    const result = await DeviceToken.updateMany(
      { userId: canonicalUserId },
      { $set: { isActive: false, lastSeenAt: new Date() } }
    );

    logger.info(`[FCM DEVICE DEACTIVATED ALL] userId=${canonicalUserId} count=${result.modifiedCount}`);

    return res.status(200).json({
      success: true,
      message: `Logged out ${result.modifiedCount} device(s) successfully`,
      deactivatedCount: result.modifiedCount,
    });
  } catch (err) {
    logger.error("logoutAllDevices error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to logout all devices" });
  }
};

const getAdminDeviceDiagnostics = async (req, res) => {
  try {
    const { userId } = req.params;
    const mongoose = require("mongoose");
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ success: false, message: "Valid userId parameter required" });
    }

    const DeviceToken = require("../models/DeviceToken");
    const canonicalUserId = new mongoose.Types.ObjectId(userId);
    const devices = await DeviceToken.find({ userId: canonicalUserId })
      .select("deviceId role platform deviceType deviceName browser os isActive lastSeenAt createdAt token")
      .sort({ lastSeenAt: -1 })
      .lean();

    const safeDevices = devices.map((d) => ({
      _id: d._id,
      deviceId: d.deviceId,
      role: d.role,
      platform: d.platform,
      deviceType: d.deviceType,
      deviceName: d.deviceName,
      browser: d.browser,
      os: d.os,
      isActive: d.isActive,
      lastSeenAt: d.lastSeenAt,
      tokenFingerprint: d.token ? `${d.token.slice(0, 8)}...` : "unknown",
    }));

    return res.status(200).json({
      success: true,
      userId: String(canonicalUserId),
      deviceCount: safeDevices.length,
      activeDeviceCount: safeDevices.filter((d) => d.isActive).length,
      devices: safeDevices,
    });
  } catch (err) {
    logger.error("getAdminDeviceDiagnostics error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to retrieve device diagnostics" });
  }
};

const getOwnerTokenStatus = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const mongoose = require("mongoose");
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ success: false, message: "Valid ownerId parameter required" });
    }

    const DeviceToken = require("../models/DeviceToken");
    const canonicalOwnerId = new mongoose.Types.ObjectId(ownerId);
    const tokens = await DeviceToken.find({ userId: canonicalOwnerId }).lean();

    const activeTokens = tokens.filter((t) => t.isActive);
    const platforms = Array.from(new Set(tokens.map((t) => t.platform || "web")));
    const safeFingerprints = Array.from(new Set(tokens.map((t) => (t.token ? `${t.token.slice(0, 8)}...` : "unknown"))));
    const sorted = tokens.filter((t) => t.lastSeenAt).sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));

    logger.info(`[FCM DIAGNOSTIC] ownerId=${canonicalOwnerId} totalTokens=${tokens.length} activeTokens=${activeTokens.length}`);

    return res.status(200).json({
      success: true,
      ownerId: String(canonicalOwnerId),
      role: "owner",
      deviceTokenCount: tokens.length,
      activeDeviceTokenCount: activeTokens.length,
      platforms,
      lastSeenAt: sorted.length ? sorted[0].lastSeenAt : null,
      safeFingerprints,
    });
  } catch (err) {
    logger.error("getOwnerTokenStatus error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to retrieve owner token status" });
  }
};

const getUserDevices = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const DeviceToken = require("../models/DeviceToken");
    const devices = await DeviceToken.find({ userId: userCtx.userId })
      .select("_id deviceId platform deviceType deviceName browser os isActive lastSeenAt createdAt token")
      .sort({ lastSeenAt: -1 })
      .lean();

    const safeDevices = devices.map((d) => ({
      _id: d._id,
      deviceId: d.deviceId,
      platform: d.platform,
      deviceType: d.deviceType,
      deviceName: d.deviceName,
      browser: d.browser,
      os: d.os,
      isActive: d.isActive,
      lastSeenAt: d.lastSeenAt,
      tokenFingerprint: d.token ? `${d.token.slice(0, 8)}...` : "unknown",
    }));

    return res.status(200).json({ success: true, devices: safeDevices });
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
  logoutCurrentDevice,
  logoutAllDevices,
  getAdminDeviceDiagnostics,
  sendTestNotification,
  getOwnerTokenStatus,
};

