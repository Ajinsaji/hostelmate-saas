const leaveService = require("../services/leaveService");
const Staff = require("../models/Staff");
const { logger } = require("../utils/logger");

const createLeaveRequest = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.user.hostelId || tenantId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff employment record not found" });
    }

    const request = await leaveService.createLeaveRequest(tenantId, hostelId, staff._id, req.body);
    return res.status(201).json({ success: true, message: "Leave request submitted", leaveRequest: request });
  } catch (error) {
    logger.error("CREATE LEAVE REQUEST ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to create leave request" });
  }
};

const getLeaves = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { status, staffId } = req.query;

    const leaves = await leaveService.getLeaveHistory(tenantId, { status, staffId });
    return res.status(200).json({ success: true, leaves });
  } catch (error) {
    logger.error("GET LEAVES ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to retrieve leave requests" });
  }
};

const approveLeave = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const approvedBy = req.user.userId || req.user.id;
    const request = await leaveService.approveLeave(tenantId, req.params.id, approvedBy);
    return res.status(200).json({ success: true, message: "Leave approved", leaveRequest: request });
  } catch (error) {
    logger.error("APPROVE LEAVE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to approve leave" });
  }
};

const rejectLeave = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const rejectedBy = req.user.userId || req.user.id;
    const { remarks } = req.body;
    const request = await leaveService.rejectLeave(tenantId, req.params.id, rejectedBy, remarks);
    return res.status(200).json({ success: true, message: "Leave request rejected", leaveRequest: request });
  } catch (error) {
    logger.error("REJECT LEAVE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to reject leave" });
  }
};

const getMyLeaveBalances = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }

    const balances = await leaveService.getLeaveBalances(tenantId, staff._id);
    return res.status(200).json({ success: true, balances });
  } catch (error) {
    logger.error("GET MY LEAVE BALANCES ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load leave balances" });
  }
};

module.exports = {
  createLeaveRequest,
  getLeaves,
  approveLeave,
  rejectLeave,
  getMyLeaveBalances,
};
