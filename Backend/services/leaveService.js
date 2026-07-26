const LeaveType = require("../models/LeaveType");
const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const DEFAULT_LEAVE_TYPES = [
  { name: "Casual Leave", code: "CL", annualLimit: 12 },
  { name: "Sick Leave", code: "SL", annualLimit: 12 },
  { name: "Paid Leave", code: "PL", annualLimit: 15 },
  { name: "Emergency Leave", code: "EL", annualLimit: 5 },
  { name: "Marriage Leave", code: "ML", annualLimit: 5 },
  { name: "Maternity Leave", code: "MATL", annualLimit: 180 },
];

const seedDefaultLeaveTypes = async (tenantId) => {
  for (const lt of DEFAULT_LEAVE_TYPES) {
    const existing = await LeaveType.findOne({ tenantId, name: lt.name });
    if (!existing) {
      await LeaveType.create({ tenantId, ...lt });
    }
  }
};

const getLeaveBalances = async (tenantId, staffId, year = new Date().getFullYear()) => {
  await seedDefaultLeaveTypes(tenantId);
  const leaveTypes = await LeaveType.find({ tenantId, status: "Active" });

  const balances = [];
  for (const lt of leaveTypes) {
    let bal = await LeaveBalance.findOne({ tenantId, staffId, leaveTypeId: lt._id, year });
    if (!bal) {
      bal = await LeaveBalance.create({
        tenantId,
        staffId,
        leaveTypeId: lt._id,
        allocated: lt.annualLimit,
        used: 0,
        remaining: lt.annualLimit,
        year,
      });
    }
    balances.push({
      leaveType: lt,
      allocated: bal.allocated,
      used: bal.used,
      remaining: bal.remaining,
      year: bal.year,
    });
  }

  return balances;
};

const createLeaveRequest = async (tenantId, hostelId, staffId, requestData) => {
  const { leaveTypeId, fromDate, toDate, reason } = requestData;
  const start = new Date(fromDate);
  const end = new Date(toDate);

  if (end < start) {
    throw { statusCode: 400, message: "toDate cannot be before fromDate" };
  }

  const diffTime = Math.abs(end - start);
  const numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  const currentYear = start.getFullYear();

  // Validate balance
  const balances = await getLeaveBalances(tenantId, staffId, currentYear);
  const targetBal = balances.find((b) => b.leaveType._id.toString() === leaveTypeId.toString());

  if (!targetBal || targetBal.remaining < numberOfDays) {
    throw {
      statusCode: 400,
      message: `Insufficient leave balance. Remaining: ${targetBal ? targetBal.remaining : 0} day(s), Requested: ${numberOfDays} day(s)`,
    };
  }

  const leaveReq = await LeaveRequest.create({
    tenantId,
    hostelId,
    staffId,
    leaveTypeId,
    fromDate: start,
    toDate: end,
    numberOfDays,
    reason,
    status: "Pending",
  });

  await AuditLog.create({
    hostelId,
    userId: staffId,
    action: "Leave Requested",
    actionType: "CREATE",
    entity: "LeaveRequest",
    targetId: leaveReq._id,
    targetModel: "LeaveRequest",
    details: { numberOfDays, reason },
  });

  try {
    const Owner = require("../models/Owner");
    const owner = await Owner.findOne({ hostelId, role: "owner" });
    if (owner?._id) {
      await publishNotification({
        userId: owner._id,
        hostelId,
        type: "reminder",
        title: "New Leave Request Submitted",
        message: `Staff member submitted a leave request for ${numberOfDays} day(s)`,
        meta: { route: "/attendance-shifts" },
      });
    }
  } catch (e) {
    logger.error("Leave request notification error:", e?.message);
  }

  return leaveReq;
};

const approveLeave = async (tenantId, leaveRequestId, approvedBy) => {
  const leaveReq = await LeaveRequest.findOne({ _id: leaveRequestId, tenantId, status: "Pending" });
  if (!leaveReq) {
    throw { statusCode: 404, message: "Pending leave request not found" };
  }

  leaveReq.status = "Approved";
  leaveReq.approvedBy = approvedBy;
  leaveReq.approvedAt = new Date();
  await leaveReq.save();

  // Deduct from LeaveBalance
  const year = new Date(leaveReq.fromDate).getFullYear();
  const balance = await LeaveBalance.findOne({
    tenantId,
    staffId: leaveReq.staffId,
    leaveTypeId: leaveReq.leaveTypeId,
    year,
  });

  if (balance) {
    balance.used += leaveReq.numberOfDays;
    balance.remaining = Math.max(balance.allocated - balance.used, 0);
    await balance.save();
  }

  // Create/update Attendance records as "Leave"
  let curr = new Date(leaveReq.fromDate);
  const end = new Date(leaveReq.toDate);
  while (curr <= end) {
    const dateCopy = new Date(curr);
    dateCopy.setHours(0, 0, 0, 0);

    let att = await Attendance.findOne({ tenantId, staffId: leaveReq.staffId, attendanceDate: dateCopy });
    if (!att) {
      att = new Attendance({
        tenantId,
        hostelId: leaveReq.hostelId,
        staffId: leaveReq.staffId,
        attendanceDate: dateCopy,
      });
    }
    att.attendanceStatus = "Leave";
    att.remarks = `On approved leave: ${leaveReq.reason}`;
    await att.save();

    curr.setDate(curr.getDate() + 1);
  }

  await AuditLog.create({
    hostelId: leaveReq.hostelId,
    userId: approvedBy,
    action: "Leave Approved",
    actionType: "UPDATE",
    entity: "LeaveRequest",
    targetId: leaveReq._id,
    targetModel: "LeaveRequest",
  });

  try {
    const staff = await Staff.findById(leaveReq.staffId);
    if (staff?.userId) {
      await publishNotification({
        userId: staff.userId,
        hostelId: leaveReq.hostelId,
        type: "system_update",
        title: "Leave Approved",
        message: `Your leave request for ${leaveReq.numberOfDays} day(s) was approved`,
        meta: { route: "/warden/dashboard" },
      });
    }
  } catch (e) {
    logger.error("Leave approval notification error:", e?.message);
  }

  return leaveReq;
};

const rejectLeave = async (tenantId, leaveRequestId, rejectedBy, remarks = "") => {
  const leaveReq = await LeaveRequest.findOne({ _id: leaveRequestId, tenantId, status: "Pending" });
  if (!leaveReq) {
    throw { statusCode: 404, message: "Pending leave request not found" };
  }

  leaveReq.status = "Rejected";
  leaveReq.approvedBy = rejectedBy;
  leaveReq.approvedAt = new Date();
  leaveReq.remarks = remarks;
  await leaveReq.save();

  await AuditLog.create({
    hostelId: leaveReq.hostelId,
    userId: rejectedBy,
    action: "Leave Rejected",
    actionType: "UPDATE",
    entity: "LeaveRequest",
    targetId: leaveReq._id,
    targetModel: "LeaveRequest",
  });

  return leaveReq;
};

const getLeaveHistory = async (tenantId, filters = {}) => {
  const query = { tenantId };
  if (filters.staffId) query.staffId = filters.staffId;
  if (filters.status) query.status = filters.status;

  return LeaveRequest.find(query)
    .populate({ path: "staffId", select: "fullName employeeCode photo" })
    .populate("leaveTypeId")
    .sort({ createdAt: -1 });
};

module.exports = {
  seedDefaultLeaveTypes,
  getLeaveBalances,
  createLeaveRequest,
  approveLeave,
  rejectLeave,
  getLeaveHistory,
};
