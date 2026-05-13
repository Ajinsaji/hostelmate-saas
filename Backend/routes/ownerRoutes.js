const express = require("express");

const router = express.Router();

const {
  loginOwner,
  resetOwnerPassword,
  setOwnerStatus,
  forceLogout,
  transferOwnership,
  getDashboardStats,
  getPendingCount,
  getAdmissions,
  approveAdmission,
  rejectAdmission,
} = require("../controllers/ownerController");

const ownerAuth = require("../middleware/ownerAuth");

// Owner login
router.post("/login", loginOwner);

// Owner Dashboard
router.get("/dashboard", ownerAuth, getDashboardStats);
router.get("/pending-count", ownerAuth, getPendingCount);

// Public Admissions
router.get("/admissions", ownerAuth, getAdmissions);
router.put("/admissions/:id/approve", ownerAuth, approveAdmission);
router.put("/admissions/:id/reject", ownerAuth, rejectAdmission);

// Superadmin actions
router.put("/owners/reset-password", resetOwnerPassword);
router.put("/owners/:ownerId/status", setOwnerStatus);
router.put("/owners/force-logout", forceLogout);
router.put("/owners/transfer-ownership", transferOwnership);

module.exports = router;

