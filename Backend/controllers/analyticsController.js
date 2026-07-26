const analyticsService = require("../services/analyticsService");
const { logger } = require("../utils/logger");

const getDashboardKPIs = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { hostelId } = req.query;
    const kpis = await analyticsService.getDashboardKPIs(tenantId, hostelId);
    return res.status(200).json({ success: true, kpis });
  } catch (error) {
    logger.error("GET DASHBOARD KPIS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load dashboard KPIs" });
  }
};

const getOccupancyAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const analytics = await analyticsService.getOccupancyAnalytics(tenantId);
    return res.status(200).json({ success: true, occupancy: analytics });
  } catch (error) {
    logger.error("GET OCCUPANCY ANALYTICS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load occupancy analytics" });
  }
};

const getFinancialAnalytics = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const analytics = await analyticsService.getFinancialAnalytics(tenantId);
    return res.status(200).json({ success: true, financial: analytics });
  } catch (error) {
    logger.error("GET FINANCIAL ANALYTICS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load financial analytics" });
  }
};

const getDrillDownData = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { type } = req.query;
    const drillDown = await analyticsService.getDrillDownData(tenantId, type);
    return res.status(200).json({ success: true, drillDown });
  } catch (error) {
    logger.error("GET DRILL DOWN ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load drill down details" });
  }
};

module.exports = {
  getDashboardKPIs,
  getOccupancyAnalytics,
  getFinancialAnalytics,
  getDrillDownData,
};
