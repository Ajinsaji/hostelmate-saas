const MaintenanceLog = require("../models/MaintenanceLog");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function recordAuditLog({ hostelId, userId, action, actionType, entity, targetId, details, ipAddress }) {
  try {
    await AuditLog.create({
      hostelId,
      userId: userId || null,
      action,
      actionType,
      entity: entity || "Maintenance",
      targetId,
      targetModel: "MaintenanceLog",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording maintenance audit log:", err);
  }
}

async function createMaintenanceLog(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Validate target belongs to this active hostel
  if (data.targetType === "Room") {
    const room = await Room.findOne({ _id: data.targetId, hostelId, isDeleted: false });
    if (!room) throw new Error("Target room not found in active hostel");
    data.targetName = `Room ${room.roomNumber}`;
  } else if (data.targetType === "Bed") {
    const bed = await Bed.findOne({ _id: data.targetId, hostelId, isDeleted: false });
    if (!bed) throw new Error("Target bed not found in active hostel");
    data.targetName = `Bed ${bed.bedNumber}`;
  } else {
    throw new Error("Invalid targetType for maintenance: must be Room or Bed");
  }

  const log = await MaintenanceLog.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    status: data.status || "In Progress",
    startDate: data.startDate || new Date(),
    createdBy: userContext.userId,
  });

  // Update target room or bed status while preserving existing assignment
  if (data.targetType === "Room") {
    await Room.findOneAndUpdate(
      { _id: data.targetId, hostelId },
      { status: "Under Maintenance" }
    );
  } else if (data.targetType === "Bed") {
    // Note: Do NOT clear residentId; preserve resident assignment in maintenance mode
    await Bed.findOneAndUpdate(
      { _id: data.targetId, hostelId },
      { status: "Maintenance" }
    );
    const bed = await Bed.findOne({ _id: data.targetId, hostelId });
    if (bed?.roomId) {
      const { recalculateRoomStatus } = require("./roomService");
      await recalculateRoomStatus(bed.roomId);
    }
  }

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Maintenance Log for ${log.targetName}: ${log.reason}`,
    actionType: "CREATE",
    entity: "Maintenance",
    targetId: log._id,
    details: { targetType: log.targetType, targetId: log.targetId, reason: log.reason },
    ipAddress: userContext.ip,
  });

  return log;
}

async function completeMaintenanceLog(logId, completionData = {}, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const log = await MaintenanceLog.findOne({ _id: logId, hostelId });
  if (!log) throw new Error("Maintenance record not found in active hostel");

  // Idempotency: if already completed, do not duplicate side-effects
  if (log.status === "Completed") {
    return log;
  }

  log.status = "Completed";
  log.completedDate = completionData.completedDate || new Date();
  if (completionData.cost !== undefined) log.cost = completionData.cost;
  if (completionData.performedBy) log.performedBy = completionData.performedBy;
  await log.save();

  const { recalculateRoomStatus } = require("./roomService");

  // CRITICAL REQUIREMENT:
  // Completing maintenance must NOT blindly mark an occupied room or bed as Vacant.
  if (log.targetType === "Bed") {
    const bed = await Bed.findOne({ _id: log.targetId, hostelId });
    if (bed) {
      // Check if there is an active resident assigned to this bed
      const activeResident = await Resident.findOne({
        bedId: bed._id,
        hostelId,
        status: { $in: ["Active", "active"] },
        isDeleted: false,
      });

      if (bed.residentId || activeResident) {
        // Bed was occupied before maintenance: restore to Occupied
        bed.status = "Occupied";
        if (!bed.residentId && activeResident) {
          bed.residentId = activeResident._id;
        }
      } else {
        // Bed was genuinely vacant
        bed.status = "Vacant";
        bed.residentId = null;
      }
      await bed.save();

      if (bed.roomId) {
        await recalculateRoomStatus(bed.roomId);
      }
    }
  } else if (log.targetType === "Room") {
    const room = await Room.findOne({ _id: log.targetId, hostelId });
    if (room) {
      // Temporarily clear "Under Maintenance" state so recalculateRoomStatus can determine true state
      room.status = "Vacant";
      await room.save();

      // Authoritative recalculation based on actual beds and resident occupancy
      await recalculateRoomStatus(room._id);
    }
  }

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Completed Maintenance for ${log.targetName}`,
    actionType: "UPDATE",
    entity: "Maintenance",
    targetId: log._id,
    details: { completedDate: log.completedDate, cost: log.cost },
    ipAddress: userContext.ip,
  });

  return log;
}

async function getMaintenanceLogs(hostelId, status) {
  if (!hostelId) return [];
  const query = { hostelId };
  if (status) query.status = status;
  return await MaintenanceLog.find(query).sort({ createdAt: -1 });
}

module.exports = {
  createMaintenanceLog,
  completeMaintenanceLog,
  getMaintenanceLogs,
};
