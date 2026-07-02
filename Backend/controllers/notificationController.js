const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const NotificationSetting = require("../models/NotificationSetting");
const { getMessaging } = require("../utils/firebaseAdmin");
const { sendPushToUserDevices } = require("../utils/fcmService");
const { emitNotificationToUser } = require("../utils/socketManager");

// store/refresh token
const registerDeviceToken = async (req, res) => {
  try {
    const { token, platform } = req.body || {};
    const userId = req.user?.userId;

    if (!token) {
      return res.status(400).json({ success: false, message: "token is required" });
    }
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // SCOPED BY JWT PAYLOAD ONLY (prevents role/hostel spoofing from client)
    const hostelId = req.user?.hostelId || null;
    const role = req.user?.role || "owner";

    await DeviceToken.findOneAndUpdate(
      { token },
      {
        $set: {
          userId,
          role,
          hostelId,
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
    const userId = req.user?.userId;
    const role = req.user?.role;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });


    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const skip = (page - 1) * limit;

    // Strict isolation: ALWAYS by JWT userId.
    // Additionally scope by hostelId only when present in JWT.
    // This prevents cross-hostel leakage for owner/owner/warden.
    const query = { userId };
    if (hostelId) query.hostelId = hostelId;

    if (!role) {
      return res.status(401).json({ success: false, message: "Invalid token role" });
    }

    const [notifications, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments(query),
    ]);

    res.status(200).json({ success: true, notifications, total, page, limit });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch notifications", error: e?.message });
  }
};


const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { userId, isRead: false };
    if (hostelId) query.hostelId = hostelId;

    const count = await Notification.countDocuments(query);
    res.status(200).json({ success: true, unreadCount: count || 0 });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch unread count", error: e?.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { userId, isRead: false };
    if (hostelId) query.hostelId = hostelId;

    const result = await Notification.updateMany(query, {
      isRead: true,
      readAt: new Date(),
    });

    res.status(200).json({
      success: true,
      updatedCount: result.modifiedCount ?? result.nModified ?? 0,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to mark all read", error: e?.message });
  }
};

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const hostelId = req.user?.hostelId || null;
    const { notificationId } = req.params;

    const filter = { _id: notificationId, userId };
    if (hostelId) filter.hostelId = hostelId;

    const updated = await Notification.findOneAndUpdate(
      filter,
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

const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const query = { userId, isRead: true };
    if (hostelId) query.hostelId = hostelId;

    const result = await Notification.deleteMany(query);

    res.status(200).json({
      success: true,
      deletedCount: result.deletedCount ?? 0,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to delete read notifications", error: e?.message });
  }
};

const getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const settings = await NotificationSetting.findOne({ userId, role, hostelId });
    if (!settings) {
      return res.status(200).json({
        success: true,
        settings: {
          categories: {
            payments: true,
            admissions: true,
            residents: true,
            rooms: true,
            staff: true,
            subscription: true,
            system: true,
          },
          browserNotifications: true,
          pushNotifications: true,
          emailNotifications: false,
          smsNotifications: false,
        },
      });
    }

    res.status(200).json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to fetch notification settings", error: e?.message });
  }
};

const updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const hostelId = req.user?.hostelId || null;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const payload = req.body || {};
    const settingsPayload = {
      categories: {
        payments: payload.categories?.payments ?? true,
        admissions: payload.categories?.admissions ?? true,
        residents: payload.categories?.residents ?? true,
        rooms: payload.categories?.rooms ?? true,
        staff: payload.categories?.staff ?? true,
        subscription: payload.categories?.subscription ?? true,
        system: payload.categories?.system ?? true,
      },
      browserNotifications: payload.browserNotifications ?? true,
      pushNotifications: payload.pushNotifications ?? true,
      emailNotifications: payload.emailNotifications ?? false,
      smsNotifications: payload.smsNotifications ?? false,
    };

    const settings = await NotificationSetting.findOneAndUpdate(
      { userId, role, hostelId },
      { $set: settingsPayload },
      { upsert: true, new: true }
    );

    res.status(200).json({ success: true, settings });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to update notification settings", error: e?.message });
  }
};

module.exports = {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
  markAllNotificationsRead,
  deleteReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
};

