const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");

const {
  getActiveContext,
  updateActiveContext,
  getWorkspaceOverview,
  listWorkspaceHostels,
  createWorkspaceHostel,
} = require("../controllers/workspaceController");

const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const FeatureRegistry = require("../services/FeatureRegistry");

// Feature gate status endpoint
const getFeatureGateStatus = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID required in context" });
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
      FeatureRegistry.has(workspaceId, "analytics"), // maps to exports/reports
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

router.get("/workspaces/active-context", getActiveContext);
router.patch("/workspaces/active-context", updateActiveContext);
router.get("/workspaces/overview", getWorkspaceOverview);
router.get("/workspaces/hostels", listWorkspaceHostels);
router.post("/workspaces/hostels", createWorkspaceHostel);
router.get("/workspaces/feature-gate", getFeatureGateStatus);

module.exports = router;
