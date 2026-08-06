const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");

const {
  getActiveContext,
  updateActiveContext,
  getWorkspaceOverview,
  listWorkspaceHostels,
  createWorkspaceHostel,
  getWorkspaceActivity,
  workspaceUniversalSearch,
  getWorkspaceInsights,
} = require("../controllers/workspaceController");

const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const FeatureRegistry = require("../services/FeatureRegistry");

const analyticsService = require("../services/AnalyticsService");
const aiService = require("../services/AIService");
const billingService = require("../services/BillingService");
const storageService = require("../services/StorageService");
const reportService = require("../services/ReportService");

const whiteLabelService = require("../services/WhiteLabelService");
const developerService = require("../services/DeveloperService");
const marketplaceService = require("../services/MarketplaceService");
const auditService = require("../services/AuditService");
const backupService = require("../services/BackupService");

const {
  getLatestRelease,
  getAllReleases,
  getReleaseByVersion,
  createRelease,
  updateRelease,
  deleteRelease,
  markReleaseAsRead
} = require("../controllers/releaseController");

// Feature gate status endpoint
const getFeatureGateStatus = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID required" });
    }

    const [
      hostels,
      residents,
      staff,
      storage,
      payrollAllowed,
      aiAllowed,
      reportsAllowed,
      analyticsAllowed,
      marketplaceAllowed,
    ] = await Promise.all([
      BusinessRuleEngine.canCreateHostel(workspaceId),
      BusinessRuleEngine.canCreateResident(workspaceId),
      BusinessRuleEngine.canInviteStaff(workspaceId),
      BusinessRuleEngine.canUploadDocument(workspaceId, 0),
      FeatureRegistry.has(workspaceId, "payroll"),
      FeatureRegistry.has(workspaceId, "canUseAI"),
      FeatureRegistry.has(workspaceId, "analytics"),
      FeatureRegistry.has(workspaceId, "analytics"),
      FeatureRegistry.has(workspaceId, "marketplace"),
    ]);

    res.status(200).json({
      success: true,
      gates: {
        hostels,
        residents,
        staff,
        storage,
        payroll: { allowed: payrollAllowed, limit: payrollAllowed ? "Unlimited" : 0, used: 0, remaining: payrollAllowed ? "Unlimited" : 0, message: payrollAllowed ? null : "Upgrade to Pro" },
        ai: { allowed: aiAllowed, limit: aiAllowed ? "Unlimited" : 0, used: 0, remaining: aiAllowed ? "Unlimited" : 0, message: aiAllowed ? null : "Upgrade to Pro" },
        reports: { allowed: reportsAllowed, limit: reportsAllowed ? "Unlimited" : 0, used: 0, remaining: reportsAllowed ? "Unlimited" : 0, message: reportsAllowed ? null : "Upgrade to Pro" },
        analytics: { allowed: analyticsAllowed, limit: analyticsAllowed ? "Unlimited" : 0, used: 0, remaining: analyticsAllowed ? "Unlimited" : 0, message: analyticsAllowed ? null : "Upgrade to Pro" },
        marketplace: { allowed: marketplaceAllowed, limit: marketplaceAllowed ? "Unlimited" : 0, used: 0, remaining: marketplaceAllowed ? "Unlimited" : 0, message: marketplaceAllowed ? null : "Upgrade to Pro" },
      },
    });
  } catch (error) {
    console.error("getFeatureGateStatus error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Apply ownerAuth to all v2 workspace routes
router.use(ownerAuth);

// Base workspace routes
router.get("/workspaces/active-context", getActiveContext);
router.patch("/workspaces/active-context", updateActiveContext);
router.get("/workspaces/overview", getWorkspaceOverview);
router.get("/workspaces/hostels", listWorkspaceHostels);
router.post("/workspaces/hostels", createWorkspaceHostel);
router.get("/workspaces/feature-gate", getFeatureGateStatus);
router.get("/workspaces/activity", getWorkspaceActivity);
router.get("/workspaces/search", workspaceUniversalSearch);
router.get("/workspaces/insights", getWorkspaceInsights);

// Module 1 — Analytics Engine
router.get("/analytics/dashboard", async (req, res) => {
  const data = await analyticsService.getDashboard(req.context.workspaceId, req.context.activeHostelId);
  res.json({ success: true, ...data });
});
router.get("/analytics/revenue", async (req, res) => {
  const data = await analyticsService.getRevenue(req.context.workspaceId);
  res.json({ success: true, ...data });
});
router.get("/analytics/occupancy", async (req, res) => {
  const data = await analyticsService.getOccupancy(req.context.workspaceId);
  res.json({ success: true, ...data });
});
router.get("/analytics/finance", async (req, res) => {
  const data = await analyticsService.getFinance(req.context.workspaceId);
  res.json({ success: true, ...data });
});
router.get("/analytics/residents", async (req, res) => {
  const data = await analyticsService.getResidents(req.context.workspaceId);
  res.json({ success: true, ...data });
});

// Module 2 — AI Intelligence
router.get("/ai/overview", async (req, res) => {
  const data = await aiService.getOverview(req.context.workspaceId);
  res.json(data);
});
router.get("/ai/recommendations", async (req, res) => {
  const data = await aiService.getRecommendations(req.context.workspaceId);
  res.json(data);
});
router.get("/ai/predictions", async (req, res) => {
  const data = await aiService.getPredictions(req.context.workspaceId);
  res.json(data);
});

// Module 3 — Subscription & Billing
router.get("/billing", async (req, res) => {
  const data = await billingService.getBillingOverview(req.context.workspaceId);
  res.json(data);
});
router.post("/billing/checkout", async (req, res) => {
  const data = await billingService.processCheckout(req.context.workspaceId, req.body);
  res.json(data);
});
router.post("/billing/coupon", async (req, res) => {
  const data = await billingService.validateCoupon(req.body.couponCode);
  res.json(data);
});
router.get("/billing/invoices", async (req, res) => {
  const data = await billingService.getInvoices(req.context.workspaceId);
  res.json(data);
});

// Module 4 — Storage Center
router.get("/storage", async (req, res) => {
  const data = await storageService.getStorageOverview(req.context.workspaceId);
  res.json(data);
});
router.post("/storage/archive", async (req, res) => {
  const data = await storageService.archiveItem(req.context.workspaceId, req.body.itemId);
  res.json(data);
});
router.post("/storage/cleanup", async (req, res) => {
  const data = await storageService.cleanupStorage(req.context.workspaceId);
  res.json(data);
});
router.delete("/storage/delete", async (req, res) => {
  const data = await storageService.deleteItem(req.context.workspaceId, req.body.itemId);
  res.json(data);
});

// Module 5 — Professional Reports
router.get("/reports", async (req, res) => {
  const data = await reportService.getAvailableReports(req.context.workspaceId);
  res.json(data);
});
router.post("/reports/generate", async (req, res) => {
  const data = await reportService.generateReport(req.context.workspaceId, req.body);
  res.json(data);
});
router.post("/reports/email", async (req, res) => {
  const data = await reportService.emailReport(req.context.workspaceId, req.body);
  res.json(data);
});

// WAVE 4 ENTERPRISE ENDPOINTS
router.get("/enterprise/branding", async (req, res) => {
  const data = await whiteLabelService.getBranding(req.context.workspaceId);
  res.json(data);
});
router.put("/enterprise/branding", async (req, res) => {
  const data = await whiteLabelService.updateBranding(req.context.workspaceId, req.body);
  res.json(data);
});
router.post("/enterprise/domain", async (req, res) => {
  const data = await whiteLabelService.addDomain(req.context.workspaceId, req.body);
  res.json(data);
});
router.get("/enterprise/domain/status", async (req, res) => {
  const data = await whiteLabelService.getDomainStatus(req.context.workspaceId);
  res.json(data);
});
router.delete("/enterprise/domain", async (req, res) => {
  const data = await whiteLabelService.removeDomain(req.context.workspaceId);
  res.json(data);
});

router.get("/developer/api-keys", async (req, res) => {
  const data = await developerService.getApiKeys(req.context.workspaceId);
  res.json(data);
});
router.post("/developer/api-keys", async (req, res) => {
  const data = await developerService.generateApiKey(req.context.workspaceId, req.body);
  res.json(data);
});
router.delete("/developer/api-keys/:id", async (req, res) => {
  const data = await developerService.deleteApiKey(req.context.workspaceId, req.params.id);
  res.json(data);
});
router.get("/developer/webhooks", async (req, res) => {
  const data = await developerService.getWebhooks(req.context.workspaceId);
  res.json(data);
});
router.post("/developer/webhooks", async (req, res) => {
  const data = await developerService.createWebhook(req.context.workspaceId, req.body);
  res.json(data);
});
router.put("/developer/webhooks/:id", async (req, res) => {
  const data = await developerService.updateWebhook(req.context.workspaceId, req.params.id, req.body);
  res.json(data);
});
router.delete("/developer/webhooks/:id", async (req, res) => {
  const data = await developerService.deleteWebhook(req.context.workspaceId, req.params.id);
  res.json(data);
});

router.get("/marketplace", async (req, res) => {
  const data = await marketplaceService.getPlugins(req.context.workspaceId);
  res.json(data);
});
router.post("/marketplace/install", async (req, res) => {
  const data = await marketplaceService.installPlugin(req.context.workspaceId, req.body);
  res.json(data);
});
router.put("/marketplace/configure", async (req, res) => {
  const data = await marketplaceService.configurePlugin(req.context.workspaceId, req.body);
  res.json(data);
});
router.delete("/marketplace/uninstall", async (req, res) => {
  const data = await marketplaceService.uninstallPlugin(req.context.workspaceId, req.body.pluginId);
  res.json(data);
});

router.get("/audit", async (req, res) => {
  const data = await auditService.getAuditLogs(req.context.workspaceId);
  res.json(data);
});
router.get("/audit/export", async (req, res) => {
  const data = await auditService.exportAudit(req.context.workspaceId);
  res.json(data);
});
router.get("/audit/:id", async (req, res) => {
  const data = await auditService.getAuditById(req.context.workspaceId, req.params.id);
  res.json(data);
});

router.get("/backups", async (req, res) => {
  const data = await backupService.getBackups(req.context.workspaceId);
  res.json(data);
});
router.post("/backups/create", async (req, res) => {
  const data = await backupService.createBackup(req.context.workspaceId, req.body);
  res.json(data);
});
router.post("/backups/restore", async (req, res) => {
  const data = await backupService.restoreBackup(req.context.workspaceId, req.body);
  res.json(data);
});
router.delete("/backups/:id", async (req, res) => {
  const data = await backupService.deleteBackup(req.context.workspaceId, req.params.id);
  res.json(data);
});

// RELEASE NOTES & IN-APP UPDATE ENDPOINTS
router.get("/releases/latest", getLatestRelease);
router.get("/releases", getAllReleases);
router.get("/releases/:version", getReleaseByVersion);
router.post("/releases", createRelease);
router.put("/releases/:id", updateRelease);
router.delete("/releases/:id", deleteRelease);
router.patch("/releases/mark-read", markReleaseAsRead);

module.exports = router;
