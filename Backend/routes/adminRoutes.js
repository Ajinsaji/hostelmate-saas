const express = require("express");

const router = express.Router();

const { requireRole } = require("../middleware/auth");

router.use(requireRole(["super_admin", "admin"]));

const {
  getDashboardStats,
  getAllRequests,
  deleteRequest,
  approveHostel,
  rejectRequest,
  getAllHostels,
  getPendingHostels,
  deleteHostel,
  getTrashHostels,
  getTrashHostelById,
  restoreHostelFromTrash,
  permanentDeleteHostelFromTrash,
  bulkHostelAction,
  updateSubscription,
  getSubscriptions,
  addHostel,
  editHostelLocation,
  resendWhatsApp,
  resetOwnerTempPassword,
  getWhatsAppDiagnostics,
  testWhatsAppConfig,
  getAdminProfile,
  updateAdminProfile,
  finalizeHostelActivation,
  changeAdminPassword,
  getSystemHealth,
  getDashboardOverview,
  getDashboardRevenue,
  getDashboardMonitoring,

  // Admin subscriptions listing
  getAdminSubscriptions,
  // Phase 4.2A exports
  getHostels,
  getHostelById,
  getHostelOwner,
  getAllOwnersList,
  setOwnerStatus,
  forceResetOwnerPassword,
  getAllResidentsList,
  getBusinessBI,
  getCustomerSuccess,
  getCommunications,
  markCommunicationRead,
  deleteCommunication,
  getSupportTickets,
  getAuditTrails,
  generateReport,
  getSystemSettings,
  updateSystemSettings,
  runBackup,
  getBackups,
  downloadBackup,
  impersonateOwner,
  getAdminsTeam,
  assignRequest,
  // NOTE: Phase 4.2B handlers are implemented in hostelAdminController
  // and imported separately below to avoid module.exports mismatch.
} = require("../controllers/adminController");

const {
  getHostelFinancials,
  getHostelSubscription,
  getHostelSupportTickets,
} = require("../controllers/hostelAdminController");

const {
  getCustomerHealthHandler,
  getHealthScoreHandler,
} = require("../controllers/customerHealthController");

const {
  getExecutiveSummaryHandler,
} = require("../controllers/executiveSummaryController");


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
router.get("/dashboard/executive-summary", getExecutiveSummaryHandler);

// ==========================
// OWNERS & RESIDENTS
// ==========================

router.get("/owners", getAllOwnersList);
router.put("/owners/:id/status", setOwnerStatus);
router.post("/owners/:id/reset-password", forceResetOwnerPassword);
router.get("/residents", getAllResidentsList);

// ==========================
// SUPER ADMIN MODULES
// ==========================
router.get("/business-bi", getBusinessBI);
router.get("/customer-success", getCustomerSuccess);
router.get("/communications", getCommunications);
router.put("/communications/:id/read", markCommunicationRead);
router.delete("/communications/:id", deleteCommunication);
router.get("/support", getSupportTickets);
router.get("/audit-trails", getAuditTrails);
router.post("/reports/generate", generateReport);
router.get("/settings", getSystemSettings);
router.put("/settings", updateSystemSettings);
router.post("/backup", runBackup);
router.get("/backups", getBackups);
router.get("/backup/:id/download", downloadBackup);
router.post("/impersonate", impersonateOwner);

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
router.delete("/requests/:id", deleteRequest);

router.get("/team", getAdminsTeam);

router.put("/approve/:id", approveHostel);
router.post("/approve/:id", approveHostel);

router.put("/reject/:id", rejectRequest);
router.post("/reject/:id", rejectRequest);

router.post("/assign/:id", assignRequest);
router.put("/assign/:id", assignRequest);

router.post(
  "/finalize-hostel-activation/:hostelId",
  finalizeHostelActivation
);
router.post(
  "/hostels/:hostelId/finalize-activation",
  finalizeHostelActivation
);

// ==========================
// HOSTELS & TRASH (60-DAY RETENTION)
// ==========================

router.get("/hostels", getAllHostels);
router.get("/pending-hostels", getPendingHostels);

router.get("/trash/hostels", getTrashHostels);
router.get("/trash/hostels/:id", getTrashHostelById);
router.post("/trash/hostels/:id/restore", restoreHostelFromTrash);
router.delete("/trash/hostels/:id/permanent", permanentDeleteHostelFromTrash);

router.delete("/hostels/:id", deleteHostel);
router.delete("/hostels/delete/:id", deleteHostel);

router.post("/hostels/bulk-action", bulkHostelAction);
router.post("/hostels/:ownerId/resend-whatsapp", resendWhatsApp);
router.post("/hostels/:ownerId/send-credentials", resendWhatsApp);
router.post("/owners/:ownerId/send-credentials", resendWhatsApp);
router.put("/hostels/:ownerId/reset-password", resetOwnerTempPassword);
router.post("/owners/:ownerId/reset-temp-password", resetOwnerTempPassword);

// WhatsApp Diagnostics & Testing
router.get("/whatsapp/status", getWhatsAppDiagnostics);
router.get("/whatsapp/diagnostics", getWhatsAppDiagnostics);
router.post("/whatsapp/test", testWhatsAppConfig);

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

// NOTE: GET /hostels (line 165) serves getAllHostels (legacy listing with stats).
// GET /hostels/crm serves getHostels (Phase 4.2A CRM listing) to avoid Express shadowing.
router.get("/hostels/crm", getHostels);

router.get("/hostels/:id", getHostelById);

router.get("/hostels/:id/owner", getHostelOwner);

// ==========================
// HOSTEL FINANCIALS & SUBSCRIPTION (Phase 4.2B)
// ==========================

router.get("/hostels/:id/financials", getHostelFinancials);
router.get("/hostels/:id/subscription", getHostelSubscription);
router.get("/hostels/:id/support", getHostelSupportTickets);

// ==========================
// ADMIN PROFILE
// ==========================

router.get("/profile", getAdminProfile);

router.put("/profile/update", updateAdminProfile);

router.put("/profile/change-password", changeAdminPassword);

module.exports = router;

