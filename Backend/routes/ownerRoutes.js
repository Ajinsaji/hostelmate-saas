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
  updateHostelSettings,
  updateOwnerProfile,
  updateOwnerPassword,
  saveOnboardingRules,
  completeOnboardingRooms,
  completeOnboarding,
} = require("../controllers/ownerController");

const ownerAuth = require("../middleware/ownerAuth");
const { uploadSingle } = require("../middleware/cloudinaryUpload");

// Owner login
router.post("/login", loginOwner);

// Owner Dashboard
router.get("/dashboard", ownerAuth, getDashboardStats);
router.get("/pending-count", ownerAuth, getPendingCount);

// Public Admissions
router.get("/admissions", ownerAuth, getAdmissions);
router.put("/admissions/:id/approve", ownerAuth, approveAdmission);
router.put("/admissions/:id/reject", ownerAuth, rejectAdmission);

// Owner Settings
router.put("/hostel/settings", ownerAuth, updateHostelSettings);

// Owner profile update (Cloudinary opt-in)
router.put(
  "/profile/update",
  ownerAuth,
  uploadSingle("profileImage"),
  updateOwnerProfile
);
router.put("/password/update", ownerAuth, updateOwnerPassword);
router.put("/onboarding/rules", ownerAuth, saveOnboardingRules);
router.put("/onboarding/complete-rooms", ownerAuth, completeOnboardingRooms);
router.put("/onboarding/complete", ownerAuth, completeOnboarding);

// Superadmin actions
router.put("/owners/reset-password", resetOwnerPassword);
router.put("/owners/:ownerId/status", setOwnerStatus);
router.put("/owners/force-logout", forceLogout);
router.put("/owners/transfer-ownership", transferOwnership);

module.exports = router;

