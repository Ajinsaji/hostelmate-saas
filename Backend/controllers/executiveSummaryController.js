const { getExecutiveSummary } = require("../services/dashboard/executiveSummaryService");

async function getExecutiveSummaryHandler(req, res) {
  try {
    const data = await getExecutiveSummary();
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load executive summary", error: error?.message || String(error) });
  }
}

module.exports = { getExecutiveSummaryHandler };

