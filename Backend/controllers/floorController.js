const floorService = require("../services/floorService");
const { createFloorSchema } = require("../validations/roomBedValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createFloor = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createFloorSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const floor = await floorService.createFloor(value, userCtx);
    return res.status(201).json({ success: true, message: "Floor Created", floor });
  } catch (err) {
    logger.error("createFloor error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create floor" });
  }
};

const getFloors = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const floors = await floorService.getFloorsList({
      hostelId: userCtx.hostelId,
      buildingId: req.query.buildingId,
      isDeleted: req.query.isDeleted,
    });
    return res.status(200).json({ success: true, floors });
  } catch (err) {
    logger.error("getFloors error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getFloorStatistics = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await floorService.getFloorStatistics(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (err) {
    logger.error("getFloorStatistics error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const updateFloor = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const floor = await floorService.updateFloor(req.params.id, req.body, userCtx);
    return res.status(200).json({ success: true, message: "Floor Updated", floor });
  } catch (err) {
    logger.error("updateFloor error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

const deleteFloor = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    await floorService.softDeleteFloor(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Floor Soft Deleted" });
  } catch (err) {
    logger.error("deleteFloor error:", err);
    return res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
};

const restoreFloor = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const floor = await floorService.restoreFloor(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Floor Restored", floor });
  } catch (err) {
    logger.error("restoreFloor error:", err);
    return res.status(400).json({ success: false, message: err.message || "Restore failed" });
  }
};

module.exports = {
  createFloor,
  getFloors,
  getFloorStatistics,
  updateFloor,
  deleteFloor,
  restoreFloor,
};
