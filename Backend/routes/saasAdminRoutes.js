const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/auth");
const {
  getSuperAdminDashboard,
  listFeatures,
  createFeature,
  listPlans,
  createPlan,
  updatePlan,
  getSettings,
  updateSettings,
  listHostelSubscriptions,
  overrideHostelSubscription,
  getReminderLogs,
  addInternalNote,
  exportRevenueExcel,
  exportSubscriptionsCSV,
} = require("../controllers/saasAdminController");

// Require super_admin or admin role
router.use(requireRole(["super_admin", "admin"]));

router.get("/dashboard", getSuperAdminDashboard);
router.get("/features", listFeatures);
router.post("/features", createFeature);
router.get("/plans", listPlans);
router.post("/plans", createPlan);
router.put("/plans/:id", updatePlan);
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.get("/hostels", listHostelSubscriptions);
router.post("/override", overrideHostelSubscription);
router.get("/reminder-logs", getReminderLogs);
router.post("/notes", addInternalNote);
router.get("/export/excel", exportRevenueExcel);
router.get("/export/csv", exportSubscriptionsCSV);


module.exports = router;
