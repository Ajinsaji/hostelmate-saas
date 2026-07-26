const shiftService = require("../services/shiftService");
const Staff = require("../models/Staff");
const { logger } = require("../utils/logger");

const createShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.body.hostelId || req.user.hostelId || tenantId;
    const createdBy = req.user.userId || req.user.id;

    const shift = await shiftService.createShift(tenantId, hostelId, req.body, createdBy);
    return res.status(201).json({ success: true, message: "Shift created", shift });
  } catch (error) {
    logger.error("CREATE SHIFT ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to create shift" });
  }
};

const getShifts = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.query.hostelId || req.user.hostelId;
    const shifts = await shiftService.getShifts(tenantId, hostelId);
    return res.status(200).json({ success: true, shifts });
  } catch (error) {
    logger.error("GET SHIFTS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to retrieve shifts" });
  }
};

const getShiftById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const shifts = await shiftService.getShifts(tenantId);
    const shift = shifts.find((s) => s._id.toString() === req.params.id);
    if (!shift) {
      return res.status(404).json({ success: false, message: "Shift not found" });
    }
    return res.status(200).json({ success: true, shift });
  } catch (error) {
    logger.error("GET SHIFT BY ID ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to fetch shift" });
  }
};

const updateShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const updatedBy = req.user.userId || req.user.id;
    const shift = await shiftService.updateShift(tenantId, req.params.id, req.body, updatedBy);
    return res.status(200).json({ success: true, message: "Shift updated", shift });
  } catch (error) {
    logger.error("UPDATE SHIFT ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to update shift" });
  }
};

const deleteShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const deletedBy = req.user.userId || req.user.id;
    const result = await shiftService.deleteShift(tenantId, req.params.id, deletedBy);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error("DELETE SHIFT ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to delete shift" });
  }
};

const assignShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.body.hostelId || req.user.hostelId || tenantId;
    const assignedBy = req.user.userId || req.user.id;
    const assignment = await shiftService.assignShift(tenantId, hostelId, req.body, assignedBy);
    return res.status(201).json({ success: true, message: "Shift assigned to staff", assignment });
  } catch (error) {
    logger.error("ASSIGN SHIFT ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to assign shift" });
  }
};

const getStaffCurrentShift = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const userId = req.user.userId || req.user.id;
    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }
    const shift = await shiftService.getStaffCurrentShift(tenantId, staff._id);
    return res.status(200).json({ success: true, shift });
  } catch (error) {
    logger.error("GET MY SHIFT ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load current shift" });
  }
};

module.exports = {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignShift,
  getStaffCurrentShift,
};
