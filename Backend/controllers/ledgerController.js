const ledgerService = require("../services/ledgerService");
const { logger } = require("../utils/logger");

const getResidentLedger = async (req, res) => {
  try {
    const residentId = req.params.residentId || req.query.residentId;
    if (!residentId) return res.status(400).json({ success: false, message: "Resident ID is required" });

    const ledger = await ledgerService.getResidentLedger(residentId);
    return res.status(200).json({ success: true, ledger });
  } catch (err) {
    logger.error("getResidentLedger error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  getResidentLedger,
};
