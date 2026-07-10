const { getCustomerHealth } = require("../services/customerHealth/customerHealthService");
const { getHealthScore } = require("../services/customerHealth/healthScoreService");

async function getCustomerHealthHandler(req, res) {
  try {
    const data = await getCustomerHealth();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error?.message || "Failed to load customer health" });
  }
}

async function getHealthScoreHandler(req, res) {
  try {
    const data = await getHealthScore();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: error?.message || "Failed to load health score" });
  }
}

module.exports = { getCustomerHealthHandler, getHealthScoreHandler };

