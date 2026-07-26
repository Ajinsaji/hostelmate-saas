const salaryAdvanceService = require("../services/salaryAdvanceService");
const Staff = require("../models/Staff");
const { logger } = require("../utils/logger");

const requestAdvance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const userId = req.user.userId || req.user.id;
    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }

    const advance = await salaryAdvanceService.requestAdvance(tenantId, staff._id, req.body);
    return res.status(201).json({ success: true, message: "Salary advance requested", advance });
  } catch (error) {
    logger.error("REQUEST ADVANCE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to request advance" });
  }
};

const getAdvances = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { status, staffId } = req.query;
    const advances = await salaryAdvanceService.getAdvances(tenantId, { status, staffId });
    return res.status(200).json({ success: true, advances });
  } catch (error) {
    logger.error("GET ADVANCES ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load salary advances" });
  }
};

const approveAdvance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const approvedBy = req.user.userId || req.user.id;
    const advance = await salaryAdvanceService.approveAdvance(tenantId, req.params.id, approvedBy);
    return res.status(200).json({ success: true, message: "Salary advance approved", advance });
  } catch (error) {
    logger.error("APPROVE ADVANCE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to approve advance" });
  }
};

const rejectAdvance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const rejectedBy = req.user.userId || req.user.id;
    const advance = await salaryAdvanceService.rejectAdvance(tenantId, req.params.id, rejectedBy);
    return res.status(200).json({ success: true, message: "Salary advance rejected", advance });
  } catch (error) {
    logger.error("REJECT ADVANCE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to reject advance" });
  }
};

module.exports = {
  requestAdvance,
  getAdvances,
  approveAdvance,
  rejectAdvance,
};
