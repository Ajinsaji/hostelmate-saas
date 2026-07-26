const Shift = require("../models/Shift");
const StaffShiftAssignment = require("../models/StaffShiftAssignment");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const seedDefaultShifts = async (tenantId, hostelId, createdBy) => {
  const defaults = [
    { shiftCode: "SH-MOR", shiftName: "Morning", startTime: "07:00", endTime: "15:00", breakDuration: 30, workingHours: 8, color: "#10b981" },
    { shiftCode: "SH-EVE", shiftName: "Evening", startTime: "15:00", endTime: "23:00", breakDuration: 30, workingHours: 8, color: "#3b82f6" },
    { shiftCode: "SH-NIG", shiftName: "Night", startTime: "23:00", endTime: "07:00", breakDuration: 30, workingHours: 8, color: "#8b5cf6" },
    { shiftCode: "SH-GEN", shiftName: "General", startTime: "09:00", endTime: "17:00", breakDuration: 60, workingHours: 8, color: "#f59e0b" },
  ];

  for (const item of defaults) {
    const exists = await Shift.findOne({ tenantId, shiftCode: item.shiftCode });
    if (!exists) {
      await Shift.create({ ...item, tenantId, hostelId, createdBy });
    }
  }
};

const createShift = async (tenantId, hostelId, shiftData, createdBy) => {
  const existingCode = await Shift.findOne({ tenantId, shiftCode: shiftData.shiftCode });
  if (existingCode) {
    throw { statusCode: 409, message: "Shift code already exists for this tenant" };
  }

  const shift = await Shift.create({
    tenantId,
    hostelId,
    ...shiftData,
    createdBy,
  });

  await AuditLog.create({
    hostelId,
    userId: createdBy,
    action: "Shift Created",
    actionType: "CREATE",
    entity: "Shift",
    targetId: shift._id,
    targetModel: "Shift",
    details: { shiftName: shift.shiftName, shiftCode: shift.shiftCode },
  });

  return shift;
};

const getShifts = async (tenantId, hostelId) => {
  const query = { tenantId, isDeleted: false };
  if (hostelId) query.hostelId = hostelId;

  let shifts = await Shift.find(query).sort({ createdAt: -1 });
  if (shifts.length === 0 && hostelId) {
    await seedDefaultShifts(tenantId, hostelId);
    shifts = await Shift.find(query).sort({ createdAt: -1 });
  }

  return shifts;
};

const updateShift = async (tenantId, shiftId, updateData, updatedBy) => {
  const shift = await Shift.findOne({ _id: shiftId, tenantId, isDeleted: false });
  if (!shift) {
    throw { statusCode: 404, message: "Shift not found" };
  }

  Object.assign(shift, updateData);
  shift.updatedBy = updatedBy;
  await shift.save();

  await AuditLog.create({
    hostelId: shift.hostelId,
    userId: updatedBy,
    action: "Shift Updated",
    actionType: "UPDATE",
    entity: "Shift",
    targetId: shift._id,
    targetModel: "Shift",
  });

  return shift;
};

const deleteShift = async (tenantId, shiftId, deletedBy) => {
  const shift = await Shift.findOne({ _id: shiftId, tenantId, isDeleted: false });
  if (!shift) {
    throw { statusCode: 404, message: "Shift not found" };
  }

  shift.isDeleted = true;
  shift.status = "Inactive";
  shift.updatedBy = deletedBy;
  await shift.save();

  return { message: "Shift deleted successfully" };
};

const assignShift = async (tenantId, hostelId, assignmentData, assignedBy) => {
  const { staffId, shiftId, effectiveFrom, effectiveTo, rotationType } = assignmentData;

  // Deactivate previous active assignments for staff
  await StaffShiftAssignment.updateMany(
    { tenantId, staffId, status: "Active" },
    { $set: { status: "Inactive", effectiveTo: new Date(effectiveFrom) } }
  );

  const assignment = await StaffShiftAssignment.create({
    tenantId,
    hostelId,
    staffId,
    shiftId,
    effectiveFrom: new Date(effectiveFrom),
    effectiveTo: effectiveTo ? new Date(effectiveTo) : null,
    rotationType: rotationType || "Fixed",
    status: "Active",
  });

  await AuditLog.create({
    hostelId,
    userId: assignedBy,
    action: "Shift Assigned",
    actionType: "UPDATE",
    entity: "StaffShiftAssignment",
    targetId: assignment._id,
    targetModel: "StaffShiftAssignment",
    details: { staffId, shiftId },
  });

  try {
    const Staff = require("../models/Staff");
    const staff = await Staff.findById(staffId);
    if (staff?.userId) {
      await publishNotification({
        userId: staff.userId,
        hostelId,
        type: "system_update",
        title: "Shift Roster Update",
        message: `Your shift roster has been updated`,
        meta: { route: "/warden/dashboard" },
      });
    }
  } catch (e) {
    logger.error("Shift assigned notification error:", e?.message);
  }

  return assignment;
};

const getStaffCurrentShift = async (tenantId, staffId, date = new Date()) => {
  const assignment = await StaffShiftAssignment.findOne({
    tenantId,
    staffId,
    status: "Active",
    effectiveFrom: { $lte: date },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: date } }],
  }).populate("shiftId");

  if (assignment?.shiftId) {
    return assignment.shiftId;
  }

  // Fallback to default General shift
  let defaultShift = await Shift.findOne({ tenantId, shiftName: "Morning", isDeleted: false });
  if (!defaultShift) {
    defaultShift = await Shift.findOne({ tenantId, isDeleted: false });
  }
  return defaultShift;
};

module.exports = {
  seedDefaultShifts,
  createShift,
  getShifts,
  updateShift,
  deleteShift,
  assignShift,
  getStaffCurrentShift,
};
