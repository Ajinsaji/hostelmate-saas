const Notification = require("../models/Notification");
const NotificationSetting = require("../models/NotificationSetting");
const DeviceToken = require("../models/DeviceToken");
const { sendPushToUserDevices } = require("./fcmService");
const { emitNotificationToUser } = require("./socketManager");

const NOTIFICATION_CATEGORY_BY_TYPE = {
  admission_submitted: "admissions",
  resident_approved: "admissions",
  resident_rejected: "admissions",
  resident_added: "residents",
  resident_checkout: "residents",
  payment_uploaded: "payments",
  payment_verified: "payments",
  bed_assigned: "rooms",
  room_added: "rooms",
  room_updated: "rooms",
  room_deleted: "rooms",
  staff_added: "staff",
  staff_removed: "staff",
  complaint_submitted: "complaints",
  complaint_raised: "complaints",
  subscription_alert: "subscription",
  subscription_reminder: "subscription",
  subscription_expired: "subscription",
  reminder: "reminders",
  system_update: "system",
};

const NOTIFICATION_PRIORITY_BY_TYPE = {
  admission_submitted: "high",
  resident_approved: "normal",
  resident_rejected: "normal",
  resident_added: "normal",
  resident_checkout: "normal",
  payment_uploaded: "high",
  payment_verified: "normal",
  bed_assigned: "normal",
  room_added: "normal",
  room_updated: "low",
  room_deleted: "high",
  staff_added: "normal",
  staff_removed: "normal",
  complaint_submitted: "normal",
  complaint_raised: "high",
  subscription_alert: "high",
  subscription_reminder: "normal",
  subscription_expired: "high",
  reminder: "normal",
  system_update: "low",
};

async function publishNotification({
  userId,
  hostelId,
  type,
  title,
  message,
  meta,
  role,
  category,
  priority,
  icon,
  actionUrl,
}) {
  const normalizedMeta = meta || {};
  const resolvedCategory = category || NOTIFICATION_CATEGORY_BY_TYPE[type] || "updates";
  const resolvedPriority = priority || NOTIFICATION_PRIORITY_BY_TYPE[type] || "normal";

  const notification = await Notification.create({
    userId,
    hostelId: hostelId || null,
    title: title || message || "HostelMate",
    message,
    type,
    category: resolvedCategory,
    priority: resolvedPriority,
    icon: icon || null,
    actionUrl: actionUrl || normalizedMeta.route || null,
    receiverRole: role || null,
    meta: normalizedMeta,
  });

  try {
    const settings = await NotificationSetting.findOne({
      userId,
      role,
      hostelId: hostelId || null,
    });

    const allowPush = settings ? settings.pushNotifications : true;
    const allowCategory = settings ? (settings.categories?.[resolvedCategory] ?? true) : true;

    if (allowPush && allowCategory) {
      const tokens = await DeviceToken.find({
        userId,
        isActive: true,
        ...(hostelId ? { hostelId } : {}),
        ...(role ? { role } : {}),
      }).select("token");

      const tokenList = tokens.map((t) => t.token);
      await sendPushToUserDevices({
        userId,
        hostelId,
        title: title || "HostelMate",
        body: message,
        data: {
          tokens: tokenList,
          payload: {
            type,
            notificationId: String(notification._id),
            route: normalizedMeta.route || "",
          },
        },
      });
    }
  } catch (e) {
    console.error("publishNotification push error:", e?.message || e);
  }

  try {
    await emitNotificationToUser({ userId, notification });
  } catch (e) {
    console.error("publishNotification socket error:", e?.message || e);
  }

  return notification;
}

module.exports = { publishNotification };

