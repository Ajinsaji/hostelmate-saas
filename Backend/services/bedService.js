const Bed = require("../models/Bed");
const Room = require("../models/Room");
const Resident = require("../models/Resident");
const AuditLog = require("../models/AuditLog");
const { recalculateRoomStatus } = require("./roomService");
const { logger } = require("../utils/logger");

async function recordAuditLog({ hostelId, userId, action, actionType, entity, targetId, details, ipAddress }) {
  try {
    await AuditLog.create({
      hostelId,
      userId: userId || null,
      action,
      actionType,
      entity: entity || "Bed",
      targetId,
      targetModel: "Bed",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording bed audit log:", err);
  }
}

async function createBed(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!data.roomId) throw new Error("Room ID is required");

  const room = await Room.findById(data.roomId);
  if (!room) throw new Error("Parent room not found");

  const bed = await Bed.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    buildingId: room.buildingId,
    floorId: room.floorId,
    status: data.status || "Vacant",
    createdBy: userContext.userId,
  });

  await recalculateRoomStatus(data.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Bed ${bed.bedNumber} in Room ${room.roomNumber}`,
    actionType: "CREATE",
    entity: "Bed",
    targetId: bed._id,
    ipAddress: userContext.ip,
  });

  return bed;
}

async function updateBed(bedId, updateData, userContext = {}) {
  const bed = await Bed.findOne({ _id: bedId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  updateData.updatedBy = userContext.userId;
  const updatedBed = await Bed.findByIdAndUpdate(bedId, updateData, { new: true });

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Updated Bed ${updatedBed.bedNumber}`,
    actionType: "UPDATE",
    entity: "Bed",
    targetId: bed._id,
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedBed;
}

async function reserveBed(bedId, reservationDetails = {}, userContext = {}) {
  const bed = await Bed.findOne({ _id: bedId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot reserve Bed ${bed.bedNumber} because it is currently occupied by a resident`);
  }

  bed.status = "Reserved";
  if (reservationDetails.description) bed.description = reservationDetails.description;
  await bed.save();

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Reserved Bed ${bed.bedNumber}`,
    actionType: "RESERVE",
    entity: "Bed",
    targetId: bed._id,
    ipAddress: userContext.ip,
  });

  return bed;
}

async function releaseBed(bedId, userContext = {}) {
  const bed = await Bed.findOne({ _id: bedId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot release occupied bed directly. Please check out the resident first.`);
  }

  bed.status = "Vacant";
  bed.residentId = null;
  await bed.save();

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Released Bed ${bed.bedNumber} to Vacant`,
    actionType: "RELEASE",
    entity: "Bed",
    targetId: bed._id,
    ipAddress: userContext.ip,
  });

  return bed;
}

async function setBedMaintenance(bedId, reason = "", userContext = {}) {
  const bed = await Bed.findOne({ _id: bedId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot put Bed ${bed.bedNumber} into maintenance mode while occupied`);
  }

  bed.status = "Maintenance";
  if (reason) bed.description = reason;
  await bed.save();

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Set Bed ${bed.bedNumber} to Maintenance mode`,
    actionType: "MAINTENANCE",
    entity: "Bed",
    targetId: bed._id,
    details: { reason },
    ipAddress: userContext.ip,
  });

  return bed;
}

async function softDeleteBed(bedId, userContext = {}) {
  const bed = await Bed.findById(bedId);
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot delete Bed ${bed.bedNumber} because a resident is currently assigned to it`);
  }

  bed.isDeleted = true;
  bed.deletedAt = new Date();
  await bed.save();

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Soft deleted Bed ${bed.bedNumber}`,
    actionType: "DELETE",
    entity: "Bed",
    targetId: bed._id,
    ipAddress: userContext.ip,
  });

  return bed;
}

async function restoreBed(bedId, userContext = {}) {
  const bed = await Bed.findById(bedId);
  if (!bed) throw new Error("Bed not found");

  bed.isDeleted = false;
  bed.deletedAt = null;
  bed.status = "Vacant";
  await bed.save();

  await recalculateRoomStatus(bed.roomId);

  await recordAuditLog({
    hostelId: bed.hostelId,
    userId: userContext.userId,
    action: `Restored Bed ${bed.bedNumber}`,
    actionType: "RESTORE",
    entity: "Bed",
    targetId: bed._id,
    ipAddress: userContext.ip,
  });

  return bed;
}

async function getBedsList({ hostelId, roomId, status, search, isDeleted = false }) {
  const query = { hostelId, isDeleted: isDeleted === true || isDeleted === "true" };
  if (roomId) query.roomId = roomId;
  if (status) query.status = status;

  if (search) {
    query.bedNumber = new RegExp(search, "i");
  }

  return await Bed.find(query)
    .populate("roomId", "roomNumber roomType floor")
    .populate("residentId", "fullName admissionNumber phone")
    .sort({ bedNumber: 1 });
}

async function getBedStatistics(hostelId) {
  const [total, vacant, occupied, reserved, maintenance, blocked] = await Promise.all([
    Bed.countDocuments({ hostelId, isDeleted: false }),
    Bed.countDocuments({ hostelId, isDeleted: false, status: { $in: ["Vacant", "vacant"] } }),
    Bed.countDocuments({ hostelId, isDeleted: false, status: { $in: ["Occupied", "occupied"] } }),
    Bed.countDocuments({ hostelId, isDeleted: false, status: "Reserved" }),
    Bed.countDocuments({ hostelId, isDeleted: false, status: "Maintenance" }),
    Bed.countDocuments({ hostelId, isDeleted: false, status: "Blocked" }),
  ]);

  const occupancyRate = total > 0 ? Math.round((occupied / total) * 100) : 0;
  const vacancyRate = total > 0 ? Math.round((vacant / total) * 100) : 0;

  return {
    totalBeds: total,
    vacantBeds: vacant,
    occupiedBeds: occupied,
    reservedBeds: reserved,
    maintenanceBeds: maintenance,
    blockedBeds: blocked,
    occupancyRate,
    vacancyRate,
  };
}

module.exports = {
  createBed,
  updateBed,
  reserveBed,
  releaseBed,
  setBedMaintenance,
  softDeleteBed,
  restoreBed,
  getBedsList,
  getBedStatistics,
};
