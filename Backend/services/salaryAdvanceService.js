const SalaryAdvance = require("../models/SalaryAdvance");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const requestAdvance = async (tenantId, staffId, advanceData) => {
  const { amount, reason } = advanceData;

  const advance = await SalaryAdvance.create({
    tenantId,
    staffId,
    amount,
    reason,
    status: "Pending",
  });

  return advance;
};

const approveAdvance = async (tenantId, advanceId, approvedBy) => {
  const advance = await SalaryAdvance.findOne({ _id: advanceId, tenantId, status: "Pending" });
  if (!advance) {
    throw { statusCode: 404, message: "Pending salary advance request not found" };
  }

  advance.status = "Approved";
  advance.approvedBy = approvedBy;
  await advance.save();

  await AuditLog.create({
    userId: approvedBy,
    action: "Salary Advance Approved",
    actionType: "UPDATE",
    entity: "SalaryAdvance",
    targetId: advance._id,
    targetModel: "SalaryAdvance",
  });

  try {
    const Staff = require("../models/Staff");
    const staff = await Staff.findById(advance.staffId);
    if (staff?.userId) {
      await publishNotification({
        userId: staff.userId,
        hostelId: staff.hostelId,
        type: "system_update",
        title: "Salary Advance Approved",
        message: `Your advance request of ₹${advance.amount} was approved`,
        meta: { route: "/my-payroll" },
      });
    }
  } catch (e) {
    logger.error("Advance approval notification error:", e?.message);
  }

  return advance;
};

const rejectAdvance = async (tenantId, advanceId, rejectedBy) => {
  const advance = await SalaryAdvance.findOne({ _id: advanceId, tenantId, status: "Pending" });
  if (!advance) {
    throw { statusCode: 404, message: "Pending salary advance request not found" };
  }

  advance.status = "Rejected";
  advance.approvedBy = rejectedBy;
  await advance.save();

  return advance;
};

const getAdvances = async (tenantId, filters = {}) => {
  const query = { tenantId };
  if (filters.staffId) query.staffId = filters.staffId;
  if (filters.status) query.status = filters.status;

  return SalaryAdvance.find(query)
    .populate({ path: "staffId", select: "fullName employeeCode photo" })
    .sort({ createdAt: -1 });
};

module.exports = {
  requestAdvance,
  approveAdvance,
  rejectAdvance,
  getAdvances,
};
