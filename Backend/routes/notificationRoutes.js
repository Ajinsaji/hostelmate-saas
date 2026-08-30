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
  logoutCurrentDevice,
  logoutAllDevices,
  getAdminDeviceDiagnostics,
  sendTestNotification,
  getOwnerTokenStatus,
} = require("../controllers/notificationController");

router.use(ownerAuth);

router.get("/settings", getNotificationSettings);
router.put("/settings", updateNotificationSettings);
router.get("/devices", getUserDevices);
router.post("/devices/logout", logoutCurrentDevice);
router.post("/devices/logout-all", logoutAllDevices);
router.get("/admin-devices/:userId", getAdminDeviceDiagnostics);
router.get("/owner-token-status/:ownerId", getOwnerTokenStatus);
router.delete("/devices/:id", deleteDeviceToken);
router.post("/test", sendTestNotification);
router.post("/device-token", registerDeviceToken);
router.post("/dispatch", dispatchNotification);
router.get("/", getNotifications);
router.get("/mine", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", markAsRead);
router.put("/:id/read", markAsRead);
router.put("/read/:id", markAsRead);
router.post("/read-all", markAllAsRead);
router.put("/read-all", markAllAsRead);

module.exports = router;
