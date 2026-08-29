const { logger } = require("./logger");
const Notification = require("../models/Notification");
const NotificationSetting = require("../models/NotificationSetting");
const DeviceToken = require("../models/DeviceToken");
const { sendPushToUserDevices } = require("./fcmService");
const { emitNotificationToUser } = require("./socketManager");
const { createPerformanceTimer } = require("./performanceTiming");

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
  const timer = createPerformanceTimer("publishNotification", logger);
  const normalizedMeta = meta || {};
  const resolvedCategory = category || NOTIFICATION_CATEGORY_BY_TYPE[type] || "updates";
  const resolvedPriority = priority || NOTIFICATION_PRIORITY_BY_TYPE[type] || "normal";

  const canonicalType = (type && String(type).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())) || "System";
  const canonicalPriority = (resolvedPriority && String(resolvedPriority).replace(/\b\w/g, (c) => c.toUpperCase())) || "Medium";
  const validHostelId = hostelId || meta?.relatedId || meta?.hostelId || null;

  const notification = await timer.measure("notificationCreationMs", () => Notification.create({
    userId,
    tenantId: validHostelId,
    hostelId: validHostelId,
    title: title || message || "HostelMate",
    message,
    type: canonicalType,
    category: resolvedCategory,
    priority: canonicalPriority,
    icon: icon || null,
    actionUrl: actionUrl || normalizedMeta.route || null,
    receiverRole: role || null,
    meta: normalizedMeta,
  }));

  let fcmResult = null;
  try {
    const mongoose = require("mongoose");
    const isObjectIdValid = userId && mongoose.Types.ObjectId.isValid(userId);

    if (!isObjectIdValid) {
      logger.warn(`[FCM RECIPIENT AUDIT] Invalid or missing recipientUserId (${userId}) - device token query & FCM push aborted`);
    } else {
      const canonicalUserId = new mongoose.Types.ObjectId(userId);
      const settings = await timer.measure("notificationSettingsMs", () => NotificationSetting.findOne({
        userId: canonicalUserId,
        role: role || null,
        hostelId: hostelId || null,
      }));

      const allowPush = settings ? settings.pushNotifications : true;
      const allowCategory = settings ? (settings.categories?.[resolvedCategory] ?? true) : true;

      if (allowPush && allowCategory) {
        const tokens = await timer.measure("deviceTokenLookupMs", () => DeviceToken.find({
          userId: canonicalUserId,
          isActive: true,
        }).select("token"));

        const tokenList = tokens.map((t) => t.token);
        const fingerprints = tokenList.map((t) => (t ? `${t.slice(0, 8)}...` : "unknown"));

        logger.info(`[FCM RECIPIENT AUDIT] event=${type || "notification"} recipientRole=${role || "user"} recipientUserId=${canonicalUserId} recipientHostelId=${hostelId || "none"} deviceTokenCount=${tokenList.length} tokenFingerprints=[${fingerprints.join(", ")}]`);

        if (tokenList.length > 0) {
          fcmResult = await timer.measure("fcmMs", () => sendPushToUserDevices({
            userId: canonicalUserId,
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
          }));
        } else {
          logger.info(`[FCM RECIPIENT AUDIT] No active device tokens found for recipientUserId=${canonicalUserId} - FCM push skipped`);
        }
      } else {
        logger.info(`[FCM RECIPIENT AUDIT] Push disabled for user ${canonicalUserId} (allowPush: ${allowPush}, allowCategory: ${allowCategory})`);
      }
    }
  } catch (e) {
    logger.error(`[FCM RECIPIENT AUDIT] Push error for user ${userId}:`, e?.message || e);
  }

  try {
    await timer.measure("socketEmissionMs", () => emitNotificationToUser({ userId, notification }));
  } catch (e) {
    logger.error("publishNotification socket error:", e?.message || e);
  }

  timer.finish("Notification performance");
  if (notification) {
    notification.fcmResult = fcmResult;
  }
  return notification;
}

module.exports = { publishNotification };

