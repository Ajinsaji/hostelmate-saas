const financialPeriodService = require("../services/financialPeriodService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id || req.admin?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const getPeriods = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const periods = await financialPeriodService.getFinancialPeriods(userCtx.hostelId);
    return res.status(200).json({ success: true, periods });
  } catch (err) {
    logger.error("getPeriods error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const closePeriod = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { month, year, remarks } = req.body;
    if (!month || !year) return res.status(400).json({ success: false, message: "Month and Year are required" });

    const period = await financialPeriodService.closePeriod(
      {
        hostelId: userCtx.hostelId,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        remarks,
      },
      userCtx
    );
    return res.status(200).json({ success: true, message: `Financial Period ${month}/${year} Closed`, period });
  } catch (err) {
    logger.error("closePeriod error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to close period" });
  }
};

const unlockPeriod = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { hostelId, month, year, remarks } = req.body;
    const targetHostel = hostelId || userCtx.hostelId;
    if (!targetHostel || !month || !year) return res.status(400).json({ success: false, message: "Hostel ID, Month, and Year are required" });

    const period = await financialPeriodService.unlockPeriod(
      {
        hostelId: targetHostel,
        month: parseInt(month, 10),
        year: parseInt(year, 10),
        remarks,
      },
      userCtx
    );
    return res.status(200).json({ success: true, message: `Financial Period ${month}/${year} Unlocked by Admin`, period });
  } catch (err) {
    logger.error("unlockPeriod error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to unlock period" });
  }
};

module.exports = {
  getPeriods,
  closePeriod,
  unlockPeriod,
};
