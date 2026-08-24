const express = require("express");

const router = express.Router();

const {
  loginOwner,
  resetOwnerPassword,
  setOwnerStatus,
  forceLogout,
  getDashboardStats,
  getPendingCount,
  getAdmissions,
  getPendingAdmissions,
  approveAdmission,
  rejectAdmission,
  updateHostelSettings,
  updateOwnerProfile,
  updateOwnerPassword,
  saveOnboardingRules,
  completeOnboardingRooms,
  completeOnboarding,
  forgotPassword,
  resetPasswordWithToken,
} = require("../controllers/ownerController");

const ownerAuth = require("../middleware/ownerAuth");
const { uploadSingle } = require("../middleware/cloudinaryUpload");

// Owner login & self-service password recovery
router.post("/login", loginOwner);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPasswordWithToken);

// Owner Dashboard
router.get("/dashboard", ownerAuth, getDashboardStats);
router.get("/pending-count", ownerAuth, getPendingCount);

// Public Admissions
router.get("/admissions", ownerAuth, getAdmissions);
router.get("/admissions/pending", ownerAuth, getPendingAdmissions);
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

// Superadmin actions — require admin authentication
const { requireRole } = require("../middleware/auth");
const adminGuard = requireRole(["super_admin", "admin"]);
router.put("/owners/reset-password", adminGuard, resetOwnerPassword);
router.put("/owners/:ownerId/status", adminGuard, setOwnerStatus);
router.put("/owners/force-logout", adminGuard, forceLogout);
router.put("/owners/transfer-ownership", adminGuard, transferOwnership);

const {
  getActiveSessions,
  revokeSession,
  revokeAllOtherSessions,
} = require("../controllers/ownerSessionController");

// Owner session management
router.get("/sessions", ownerAuth, getActiveSessions);
router.post("/sessions/:sessionId/revoke", ownerAuth, revokeSession);
router.post("/sessions/revoke-others", ownerAuth, revokeAllOtherSessions);

module.exports = router;

