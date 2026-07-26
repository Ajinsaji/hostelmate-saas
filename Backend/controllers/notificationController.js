const notificationService = require("../services/notificationCenterService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id,
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

module.exports = {
  dispatchNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};
