const express = require("express");
const router = express.Router();

const { auth } = require("../middleware/auth");

const {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
} = require("../controllers/notificationController");

// Auth must derive identity strictly from JWT (req.user.userId/role/hostelId)
router.post("/device-token", auth, registerDeviceToken);
router.get("/mine", auth, getMyNotifications);
router.get("/unread-count", auth, getUnreadCount);
router.put("/read/:notificationId", auth, markNotificationRead);

module.exports = router;


