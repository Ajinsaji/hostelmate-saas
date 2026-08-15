const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const {
  getSuperAdminDashboard,
  listSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  manualExtendSubscription,
  adjustSubscriptionDays,
  getAdminBillingCalculator,
  listHostelSubscriptions,
  getSubscriptionHistory,
  listFeatures,
  createFeature,
  listPlans,
  createPlan,
  updatePlan,
  getSettings,
  updateSettings,
  overrideHostelSubscription,
  getReminderLogs,
  addInternalNote,
  exportRevenueExcel,
  exportSubscriptionsCSV,
} = require("../controllers/saasAdminController");

// Require super_admin or admin role
router.use(requireRole(["super_admin", "admin"]));

router.get("/dashboard", getSuperAdminDashboard);

// Continuation requests management
router.get("/requests", listSubscriptionRequests);
router.post("/requests/:id/approve", approveSubscriptionRequest);
router.post("/requests/:id/reject", rejectSubscriptionRequest);

// Manual extension and adjustment
router.post("/:id/extend", manualExtendSubscription);
router.post("/extend", manualExtendSubscription);
router.post("/:id/adjust-days", adjustSubscriptionDays);
router.get("/calculator", getAdminBillingCalculator);
router.get("/:id/history", getSubscriptionHistory);

// Subscriptions directory
router.get("/hostels", listHostelSubscriptions);
router.post("/override", overrideHostelSubscription);

// Legacy routes
router.get("/features", listFeatures);
router.post("/features", createFeature);
router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/reminder-logs", getReminderLogs);
router.post("/notes", addInternalNote);
router.get("/export/excel", exportRevenueExcel);
router.get("/export/csv", exportSubscriptionsCSV);

module.exports = router;
