const OvertimeRequest = require("../models/OvertimeRequest");
const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const createOvertimeRequest = async (tenantId, hostelId, staffId, overtimeData) => {
  const { attendanceId, hours, reason } = overtimeData;

  const request = await OvertimeRequest.create({
    tenantId,
    hostelId,
    staffId,
    attendanceId,
    hours,
    reason,
    status: "Pending",
  });

  await AuditLog.create({
    hostelId,
    userId: staffId,
    action: "Overtime Claimed",
    actionType: "CREATE",
    entity: "OvertimeRequest",
    targetId: request._id,
    targetModel: "OvertimeRequest",
    details: { hours, reason },
  });

  return request;
};

const approveOvertime = async (tenantId, overtimeId, approvedBy) => {
  const request = await OvertimeRequest.findOne({ _id: overtimeId, tenantId, status: "Pending" });
  if (!request) {
    throw { statusCode: 404, message: "Pending overtime request not found" };
  }

  request.status = "Approved";
  request.approvedBy = approvedBy;
  request.approvedAt = new Date();
  await request.save();

  // Update attendance overtime hours
  const attendance = await Attendance.findById(request.attendanceId);
  if (attendance) {
    attendance.overtimeHours = request.hours;
    await attendance.save();
  }

  await AuditLog.create({
    hostelId: request.hostelId,
    userId: approvedBy,
    action: "Overtime Approved",
    actionType: "UPDATE",
    entity: "OvertimeRequest",
    targetId: request._id,
    targetModel: "OvertimeRequest",
  });

  try {
    const staff = await Staff.findById(request.staffId);
    if (staff?.userId) {
      await publishNotification({
        userId: staff.userId,
        hostelId: request.hostelId,
        type: "system_update",
        title: "Overtime Approved",
        message: `Your overtime claim for ${request.hours} hour(s) was approved`,
        meta: { route: "/warden/dashboard" },
      });
    }
  } catch (e) {
    logger.error("Overtime approval notification error:", e?.message);
  }

  return request;
};

const rejectOvertime = async (tenantId, overtimeId, rejectedBy) => {
  const request = await OvertimeRequest.findOne({ _id: overtimeId, tenantId, status: "Pending" });
  if (!request) {
    throw { statusCode: 404, message: "Pending overtime request not found" };
  }

  request.status = "Rejected";
  request.approvedBy = rejectedBy;
  request.approvedAt = new Date();
  await request.save();

  await AuditLog.create({
    hostelId: request.hostelId,
    userId: rejectedBy,
    action: "Overtime Rejected",
    actionType: "UPDATE",
    entity: "OvertimeRequest",
    targetId: request._id,
    targetModel: "OvertimeRequest",
  });

  return request;
};

const getOvertimeRequests = async (tenantId, filters = {}) => {
  const query = { tenantId };
  if (filters.staffId) query.staffId = filters.staffId;
  if (filters.status) query.status = filters.status;

  return OvertimeRequest.find(query)
    .populate({ path: "staffId", select: "fullName employeeCode photo" })
    .populate("attendanceId")
    .sort({ createdAt: -1 });
};

module.exports = {
  createOvertimeRequest,
  approveOvertime,
  rejectOvertime,
  getOvertimeRequests,
};
