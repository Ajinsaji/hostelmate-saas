const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
  markAllNotificationsRead,
  deleteReadNotifications,
  getNotificationSettings,
  updateNotificationSettings,
} = require("../controllers/notificationController");

// Auth must derive identity strictly from JWT (req.user.userId/role/hostelId)
router.post("/device-token", auth, registerDeviceToken);
router.get("/mine", auth, getMyNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.get("/settings", auth, getNotificationSettings);
router.put("/settings", auth, updateNotificationSettings);
router.put("/read/:notificationId", auth, markNotificationRead);
router.put("/read-all", auth, markAllNotificationsRead);
router.delete("/read", auth, deleteReadNotifications);

module.exports = router;


