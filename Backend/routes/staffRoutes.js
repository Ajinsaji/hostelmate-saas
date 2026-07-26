const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");
const {
  createStaff,
  getStaff,
  getStaffById,
  getStaffProfile,
  updateStaff,
  toggleStatus,
  resetPassword,
  changeSelfPassword,
  deleteStaff,
  getStaffActivity,
  getStaffDashboard,
} = require("../controllers/staffController");

// Self service & dashboard routes (Must come before :id)
router.get("/me", auth, getStaffProfile);
router.patch("/me/change-password", auth, changeSelfPassword);
router.get("/dashboard", auth, getStaffDashboard);

// Owner / Management staff endpoints
router.post("/", ownerAuth, rolePermissionMiddleware("staff", "create"), createStaff);
router.get("/", auth, rolePermissionMiddleware("staff", "view"), getStaff);
router.get("/:id", auth, rolePermissionMiddleware("staff", "view"), getStaffById);
router.get("/:id/activity", auth, rolePermissionMiddleware("staff", "view"), getStaffActivity);

router.put("/:id", ownerAuth, rolePermissionMiddleware("staff", "edit"), updateStaff);
router.delete("/:id", ownerAuth, rolePermissionMiddleware("staff", "delete"), deleteStaff);
router.patch("/:id/status", ownerAuth, rolePermissionMiddleware("staff", "edit"), toggleStatus);
router.patch("/:id/reset-password", ownerAuth, rolePermissionMiddleware("staff", "edit"), resetPassword);

module.exports = router;
