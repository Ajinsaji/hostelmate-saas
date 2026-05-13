const express = require("express");
const router = express.Router();

const ownerAuth = require("../middleware/ownerAuth");

const {
  registerDeviceToken,
  getMyNotifications,
  markNotificationRead,
  getUnreadCount,
} = require("../controllers/notificationController");

router.post("/device-token", ownerAuth, registerDeviceToken);

router.get("/mine", ownerAuth, getMyNotifications);
router.get("/unread-count", ownerAuth, getUnreadCount);

router.put("/read/:notificationId", ownerAuth, markNotificationRead);

module.exports = router;

