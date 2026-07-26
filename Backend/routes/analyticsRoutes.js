const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");

const {
  getDashboardKPIs,
  getOccupancyAnalytics,
  getFinancialAnalytics,
  getDrillDownData,
} = require("../controllers/analyticsController");

const { getForecasts } = require("../controllers/forecastController");

router.get("/dashboard", auth, getDashboardKPIs);
router.get("/occupancy", auth, getOccupancyAnalytics);
router.get("/financial", auth, getFinancialAnalytics);
router.get("/payroll", auth, getFinancialAnalytics);
router.get("/food", auth, getFinancialAnalytics);
router.get("/residents", auth, getOccupancyAnalytics);
router.get("/staff", auth, getOccupancyAnalytics);
router.get("/vendors", auth, getFinancialAnalytics);
router.get("/treasury", auth, getFinancialAnalytics);
router.get("/compare", auth, getFinancialAnalytics);
router.get("/forecast", auth, getForecasts);
router.get("/drilldown", auth, getDrillDownData);

module.exports = router;
