const wasteService = require("../services/wasteService");
const { recordWasteSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const recordWaste = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = recordWasteSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const waste = await wasteService.recordWasteLog(value, userCtx);
    return res.status(201).json({ success: true, message: "Food Wastage Logged", waste });
  } catch (err) {
    logger.error("recordWaste error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to log waste" });
  }
};

const getWasteLogs = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const logs = await wasteService.getWasteLogs(userCtx.hostelId);
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    logger.error("getWasteLogs error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  recordWaste,
  getWasteLogs,
};
