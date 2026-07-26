const overtimeService = require("../services/overtimeService");
const Staff = require("../models/Staff");
const { logger } = require("../utils/logger");

const createOvertimeRequest = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.user.hostelId || tenantId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff employment record not found" });
    }

    const request = await overtimeService.createOvertimeRequest(tenantId, hostelId, staff._id, req.body);
    return res.status(201).json({ success: true, message: "Overtime request submitted", overtimeRequest: request });
  } catch (error) {
    logger.error("CREATE OVERTIME ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to create overtime request" });
  }
};

const getOvertimeRequests = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { status, staffId } = req.query;

    const requests = await overtimeService.getOvertimeRequests(tenantId, { status, staffId });
    return res.status(200).json({ success: true, overtimeRequests: requests });
  } catch (error) {
    logger.error("GET OVERTIME REQUESTS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to retrieve overtime requests" });
  }
};

const approveOvertime = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const approvedBy = req.user.userId || req.user.id;
    const request = await overtimeService.approveOvertime(tenantId, req.params.id, approvedBy);
    return res.status(200).json({ success: true, message: "Overtime approved", overtimeRequest: request });
  } catch (error) {
    logger.error("APPROVE OVERTIME ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to approve overtime" });
  }
};

const rejectOvertime = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const rejectedBy = req.user.userId || req.user.id;
    const request = await overtimeService.rejectOvertime(tenantId, req.params.id, rejectedBy);
    return res.status(200).json({ success: true, message: "Overtime request rejected", overtimeRequest: request });
  } catch (error) {
    logger.error("REJECT OVERTIME ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to reject overtime" });
  }
};

module.exports = {
  createOvertimeRequest,
  getOvertimeRequests,
  approveOvertime,
  rejectOvertime,
};
