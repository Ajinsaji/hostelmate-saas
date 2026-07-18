const express = require("express");
const router = express.Router();
const aiAnalyticsController = require("../controllers/aiAnalyticsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/analytics", authMiddleware, aiAnalyticsController.getAnalytics);
router.get("/trends", authMiddleware, aiAnalyticsController.getTrends);
router.get("/recommendations", authMiddleware, aiAnalyticsController.getRecommendations);
router.get("/predictions", authMiddleware, aiAnalyticsController.getPredictions);

module.exports = router;
