const express = require("express");

const router = express.Router();

const { requireRole } = require("../middleware/auth");

router.use(requireRole(["super_admin", "admin"]));

const {
  getDashboardStats,
  getAllRequests,
  approveHostel,
  rejectRequest,
  getAllHostels,
  getPendingHostels,
  deleteHostel,
  updateSubscription,
  getSubscriptions,
  addHostel,
  editHostelLocation,
  resendWhatsApp,
  resetOwnerTempPassword,
  getAdminProfile,
  updateAdminProfile,
  finalizeHostelActivation,
  changeAdminPassword,
  getSystemHealth,
  getDashboardOverview,
  getDashboardRevenue,
  getDashboardMonitoring,
  // Executive summary
  getExecutiveSummary,
  // Admin subscriptions listing
  getAdminSubscriptions,
  // Phase 4.2A exports
  getHostels,
  getHostelById,
  getHostelOwner,
  // NOTE: Phase 4.2B handlers are implemented in hostelAdminController
  // and imported separately below to avoid module.exports mismatch.
} = require("../controllers/adminController");

const {
  getHostelFinancials,
  getHostelSubscription,
} = require("../controllers/hostelAdminController");

const {
  getCustomerHealthHandler,
  getHealthScoreHandler,
} = require("../controllers/customerHealthController");

const resolvedHealthScoreHandler =
  typeof getHealthScoreHandler === "function" ? getHealthScoreHandler : null;

const { uploadFields } = require("../middleware/cloudinaryUpload");

// ==========================
// DASHBOARD (legacy)
// ==========================

router.get("/dashboard", getDashboardStats);

// ==========================
// DASHBOARD 3.0 (Phase 4.1)
// ==========================

router.get("/dashboard/overview", getDashboardOverview);
router.get("/dashboard/revenue", getDashboardRevenue);
router.get("/dashboard/monitoring", getDashboardMonitoring);

// ==========================
// SYSTEM HEALTH
// ==========================

router.get("/system-health", getSystemHealth);

// ==========================
// CUSTOMER HEALTH (Phase 4.3.6)
// ==========================
router.get("/customer-health", getCustomerHealthHandler);

// ==========================
// HEALTH SCORE (Phase 4.3.7)
// ==========================
if (typeof resolvedHealthScoreHandler !== "function") {
  throw new Error("Health score handler is missing or not a function");
}
router.get("/health-score", resolvedHealthScoreHandler);




// ==========================
// REQUESTS
// ==========================

router.get("/requests", getAllRequests);

router.put("/approve/:id", approveHostel);

router.put("/reject/:id", rejectRequest);

router.post(
  "/finalize-hostel-activation/:hostelId",
  finalizeHostelActivation
);

// ==========================
// HOSTELS
// ==========================

router.get("/hostels", getAllHostels);

router.get("/pending-hostels", getPendingHostels);

router.delete("/hostels/delete/:id", deleteHostel);

router.post("/hostels/:ownerId/resend-whatsapp", resendWhatsApp);

router.put("/hostels/:ownerId/reset-password", resetOwnerTempPassword);

// ==========================
// SUBSCRIPTIONS
// ==========================

// Legacy endpoint (admin subscriptions object list)
router.get("/subscriptions", getSubscriptions);

// Super Admin listing for Subscription Center
router.get("/admin/subscriptions", getAdminSubscriptions);

router.put("/subscription/update/:id", updateSubscription);

// ADD HOSTEL (SUPERADMIN)
router.post(
  "/hostels/add",
  uploadFields([
    { name: "aadhaarFile", maxCount: 1 },
    { name: "ownerPhoto", maxCount: 1 },
    { name: "licensePhoto", maxCount: 1 },
  ]),
  addHostel
);

// EDIT HOSTEL (ADMIN)
router.put("/hostels/edit/:id", editHostelLocation);

// ==========================
// HOSTELS CRM (Phase 4.2A)
// ==========================

router.get("/hostels", getHostels);

router.get("/hostels/:id", getHostelById);

router.get("/hostels/:id/owner", getHostelOwner);

// ==========================
// HOSTEL FINANCIALS & SUBSCRIPTION (Phase 4.2B)
// ==========================

router.get("/hostels/:id/financials", getHostelFinancials);
router.get("/hostels/:id/subscription", getHostelSubscription);

// ==========================
// ADMIN PROFILE
// ==========================

router.get("/profile", getAdminProfile);

router.put("/profile/update", updateAdminProfile);

router.put("/profile/change-password", changeAdminPassword);

module.exports = router;

