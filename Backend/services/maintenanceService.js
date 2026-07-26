const MaintenanceLog = require("../models/MaintenanceLog");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function createMaintenanceLog(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const log = await MaintenanceLog.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });

  // Update target room or bed status
  if (data.targetType === "Room") {
    await Room.findByIdAndUpdate(data.targetId, { status: "Under Maintenance" });
  } else if (data.targetType === "Bed") {
    await Bed.findByIdAndUpdate(data.targetId, { status: "Maintenance" });
  }

  return log;
}

async function completeMaintenanceLog(logId, completionData = {}, userContext = {}) {
  const log = await MaintenanceLog.findById(logId);
  if (!log) throw new Error("Maintenance record not found");

  log.status = "Completed";
  log.completedDate = completionData.completedDate || new Date();
  if (completionData.cost !== undefined) log.cost = completionData.cost;
  await log.save();

  // Restore room or bed status
  if (log.targetType === "Room") {
    const { recalculateRoomStatus } = require("./roomService");
    await Room.findByIdAndUpdate(log.targetId, { status: "Vacant" });
    await recalculateRoomStatus(log.targetId);
  } else if (log.targetType === "Bed") {
    await Bed.findByIdAndUpdate(log.targetId, { status: "Vacant" });
    const { recalculateRoomStatus } = require("./roomService");
    const bed = await Bed.findById(log.targetId);
    if (bed?.roomId) await recalculateRoomStatus(bed.roomId);
  }

  return log;
}

async function getMaintenanceLogs(hostelId, status) {
  const query = { hostelId };
  if (status) query.status = status;
  return await MaintenanceLog.find(query).sort({ createdAt: -1 });
}

module.exports = {
  createMaintenanceLog,
  completeMaintenanceLog,
  getMaintenanceLogs,
};
