const buildingService = require("../services/buildingService");
const { createBuildingSchema } = require("../validations/roomBedValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createBuilding = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createBuildingSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const building = await buildingService.createBuilding(value, userCtx);
    return res.status(201).json({ success: true, message: "Building Created", building });
  } catch (err) {
    logger.error("createBuilding error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create building" });
  }
};

const getBuildings = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const buildings = await buildingService.getBuildingsList(userCtx.hostelId, req.query.isDeleted);
    return res.status(200).json({ success: true, buildings });
  } catch (err) {
    logger.error("getBuildings error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getBuildingStatistics = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await buildingService.getBuildingStatistics(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    logger.error("getBuildingStatistics error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const building = await buildingService.updateBuilding(req.params.id, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Building Updated", building });
  } catch (err) {
    logger.error("updateBuilding error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    await buildingService.softDeleteBuilding(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Building Soft Deleted" });
  } catch (err) {
    logger.error("deleteBuilding error:", err);
    return res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
};

const restoreBuilding = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const building = await buildingService.restoreBuilding(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Building Restored", building });
  } catch (err) {
    logger.error("restoreBuilding error:", err);
    return res.status(400).json({ success: false, message: err.message || "Restore failed" });
  }
};

module.exports = {
  createBuilding,
  getBuildings,
  getBuildingStatistics,
  updateBuilding,
  deleteBuilding,
  restoreBuilding,
};
