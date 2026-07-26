const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const analyticsAssistantController = require("../controllers/analyticsAssistantController");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");

// We'll define a 'businessIntelligence' module in our permission checks or rely on role check.
// Since it's highly sensitive, let's allow Owners by default, and Accountants for specific routes.
// The rolePermissionMiddleware handles this if 'AI_Platform' is defined as a module, or we can just require auth and rolePermissionMiddleware("Reports", "view") as a fallback for Phase 10.

router.use(auth);

// Dashboard
router.get("/dashboard", rolePermissionMiddleware("Reports", "view"), aiController.getDashboard);

// Predictions
router.get("/predictions", rolePermissionMiddleware("Reports", "view"), aiController.getPredictions);
router.get("/forecast", rolePermissionMiddleware("Reports", "view"), aiController.getForecast);
router.get("/churn", rolePermissionMiddleware("Reports", "view"), aiController.getChurn);

// Anomalies & Risks
router.get("/anomalies", rolePermissionMiddleware("Reports", "view"), aiController.getAnomalies);
router.get("/procurement", rolePermissionMiddleware("Reports", "view"), aiController.getProcurement);
router.get("/payroll", rolePermissionMiddleware("Reports", "view"), aiController.getPayroll);
router.get("/expenses", rolePermissionMiddleware("Reports", "view"), aiController.getExpenses);
router.get("/treasury", rolePermissionMiddleware("Reports", "view"), aiController.getTreasury);

// Recommendations
router.get("/recommendations", rolePermissionMiddleware("Reports", "view"), aiController.getRecommendations);
// Only owners can accept/dismiss business-critical actions
router.post("/recommendations/:id/action", rolePermissionMiddleware("Reports", "manage"), aiController.processRecommendationAction);

// NLP
router.post("/query", rolePermissionMiddleware("Reports", "view"), analyticsAssistantController.handleQuery);

module.exports = router;
