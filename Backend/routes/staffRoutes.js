const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { requireRole } = require("../middleware/auth");
const {
  createStaff,
  getStaffByHostel,
  updateStaff,
  resetStaffPassword,
  updateStaffStatus,
  deleteStaff,
  getStaffDashboard,
} = require("../controllers/staffController");

router.post("/create", ownerAuth, createStaff);
router.get("/hostel", ownerAuth, getStaffByHostel);
router.put("/update/:id", ownerAuth, updateStaff);
router.put("/reset-password/:id", ownerAuth, resetStaffPassword);
router.put("/status/:id", ownerAuth, updateStaffStatus);
router.delete("/delete/:id", ownerAuth, deleteStaff);
router.get("/dashboard", requireRole(["warden", "cook"]), getStaffDashboard);

module.exports = router;
