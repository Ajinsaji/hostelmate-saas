const maintenanceService = require("../services/maintenanceService");
const { createMaintenanceSchema } = require("../validations/roomBedValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createMaintenanceLog = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createMaintenanceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const log = await maintenanceService.createMaintenanceLog(value, userCtx);
    return res.status(201).json({ success: true, message: "Maintenance Logged", log });
  } catch (err) {
    logger.error("createMaintenanceLog error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to log maintenance" });
  }
};

const completeMaintenanceLog = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const log = await maintenanceService.completeMaintenanceLog(req.params.id, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Maintenance Completed", log });
  } catch (err) {
    logger.error("completeMaintenanceLog error:", err);
    return res.status(400).json({ success: false, message: err.message || "Completion failed" });
  }
};

const getMaintenanceLogs = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const logs = await maintenanceService.getMaintenanceLogs(userCtx.hostelId, req.query.status);
    return res.status(200).json({ success: true, logs });
  } catch (err) {
    logger.error("getMaintenanceLogs error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createMaintenanceLog,
  completeMaintenanceLog,
  getMaintenanceLogs,
};
