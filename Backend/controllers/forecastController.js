const forecastService = require("../services/forecastService");
const { logger } = require("../utils/logger");

const getForecasts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const timeframe = req.query.timeframe || "30d";
    const forecasts = await forecastService.generateForecasts(tenantId, timeframe);
    return res.status(200).json({ success: true, forecasts });
  } catch (error) {
    logger.error("GET FORECASTS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to generate forecast projections" });
  }
};

module.exports = {
  getForecasts,
};
