const bedService = require("../services/bedService");
const { createBedSchema } = require("../validations/roomBedValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createBedSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const bed = await bedService.createBed(value, userCtx);
    return res.status(201).json({ success: true, message: "Bed Created", bed });
  } catch (err) {
    logger.error("createBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create bed" });
  }
};

const getBeds = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const beds = await bedService.getBedsList({
      hostelId: userCtx.hostelId,
      roomId: req.query.roomId,
      status: req.query.status,
      search: req.query.search,
      isDeleted: req.query.isDeleted,
    });
    return res.status(200).json({ success: true, beds });
  } catch (err) {
    logger.error("getBeds error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getBedStatistics = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await bedService.getBedStatistics(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    logger.error("getBedStatistics error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const reserveBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const bed = await bedService.reserveBed(req.params.id, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Bed Reserved", bed });
  } catch (err) {
    logger.error("reserveBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Reservation failed" });
  }
};

const releaseBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const bed = await bedService.releaseBed(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Bed Released to Vacant", bed });
  } catch (err) {
    logger.error("releaseBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Release failed" });
  }
};

const setBedMaintenance = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const bed = await bedService.setBedMaintenance(req.params.id, req.body.reason, userCtx);
    return res.status(200).json({ success: true, message: "Bed Maintenance Mode Activated", bed });
  } catch (err) {
    logger.error("setBedMaintenance error:", err);
    return res.status(400).json({ success: false, message: err.message || "Maintenance mode failed" });
  }
};

const updateBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const bed = await bedService.updateBed(req.params.id, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Bed Updated", bed });
  } catch (err) {
    logger.error("updateBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

const deleteBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    await bedService.softDeleteBed(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Bed Soft Deleted" });
  } catch (err) {
    logger.error("deleteBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
};

const restoreBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const bed = await bedService.restoreBed(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Bed Restored", bed });
  } catch (err) {
    logger.error("restoreBed error:", err);
    return res.status(400).json({ success: false, message: err.message || "Restore failed" });
  }
};

module.exports = {
  createBed,
  getBeds,
  getBedStatistics,
  reserveBed,
  releaseBed,
  setBedMaintenance,
  updateBed,
  deleteBed,
  restoreBed,
};
