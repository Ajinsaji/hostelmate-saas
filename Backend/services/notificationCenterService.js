const Notification = require("../models/Notification");
const { logger } = require("../utils/logger");

/**
 * Shared Notification Dispatcher
 */
async function dispatchNotification(data) {
  try {
    const hostelId = data.hostelId;
    if (!hostelId) throw new Error("Hostel ID is required for notification dispatch");

    const notification = await Notification.create({
      tenantId: hostelId,
      hostelId,
      type: data.type || "System",
      title: data.title,
      message: data.message,
      priority: data.priority || "Medium",
      channel: data.channel || "In-App",
      recipientType: data.recipientType || "Owner",
      recipientId: data.recipientId || null,
      status: "Sent",
      sentAt: new Date(),
      referenceType: data.referenceType || "",
      referenceId: data.referenceId || null,
      createdBy: data.createdBy || null,
    });

    logger.info(`[NotificationCenter] Dispatched ${notification.priority} priority notification '${notification.title}' via ${notification.channel}`);
    return notification;
  } catch (err) {
    logger.error("Error dispatching notification:", err);
    throw err;
  }
}

/**
 * Get Paginated Notifications for recipient
 */
async function getNotifications({ hostelId, recipientId, recipientType = "Owner", unreadOnly = false, page = 1, limit = 20 }) {
  const query = { hostelId };
  if (recipientId) query.recipientId = recipientId;
  if (recipientType) query.recipientType = recipientType;
  if (unreadOnly) query.status = { $ne: "Read" };

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const skip = (pageNum - 1) * limitNum;

  const [notifications, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
    Notification.countDocuments(query),
  ]);

  return { notifications, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

/**
 * Mark Single Notification as Read
 */
async function markAsRead(notificationId) {
  const notification = await Notification.findById(notificationId);
  if (!notification) throw new Error("Notification not found");

  notification.status = "Read";
  notification.readAt = new Date();
  await notification.save();
  return notification;
}

/**
 * Mark All Notifications as Read for recipient
 */
async function markAllAsRead({ hostelId, recipientId }) {
  const query = { hostelId, status: { $ne: "Read" } };
  if (recipientId) query.recipientId = recipientId;

  const result = await Notification.updateMany(query, {
    $set: { status: "Read", readAt: new Date() },
  });
  return result;
}

/**
 * Get Unread Notification Count
 */
async function getUnreadCount({ hostelId, recipientId, recipientType = "Owner" }) {
  const query = { hostelId, recipientType, status: { $ne: "Read" } };
  if (recipientId) query.recipientId = recipientId;

  return await Notification.countDocuments(query);
}

module.exports = {
  dispatchNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
