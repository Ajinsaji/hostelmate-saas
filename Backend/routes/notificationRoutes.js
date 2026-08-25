const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const {
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
} = require("../controllers/notificationController");

router.use(ownerAuth);

router.get("/settings", getNotificationSettings);
router.put("/settings", updateNotificationSettings);
router.get("/devices", getUserDevices);
router.delete("/devices/:id", deleteDeviceToken);
router.post("/test", sendTestNotification);
router.post("/device-token", registerDeviceToken);
router.post("/dispatch", dispatchNotification);
router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.post("/read-all", markAllAsRead);

module.exports = router;
