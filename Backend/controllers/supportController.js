const { getSupport } = require("../services/support/supportService");

async function getSupportHandler(req, res) {
  try {
    const data = await getSupport();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || "Failed to load support" });
  }
}

module.exports = { getSupportHandler };

