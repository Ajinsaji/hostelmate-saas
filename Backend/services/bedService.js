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
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!data.roomId) throw new Error("Room ID is required");

  // Verify the parent Room in the authenticated active hostel
  const room = await Room.findOne({ _id: data.roomId, hostelId, isDeleted: false });
  if (!room) throw new Error("Parent room not found in active hostel");

  const bed = await Bed.create({
    ...data,
    tenantId: room.hostelId,
    hostelId: room.hostelId,
    buildingId: room.buildingId,
    floorId: room.floorId,
    roomId: room._id,
    status: data.status || "Vacant",
    createdBy: userContext.userId,
  });

  await recalculateRoomStatus(data.roomId);

  await recordAuditLog({
    hostelId: room.hostelId,
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
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  updateData.updatedBy = userContext.userId;
  const updatedBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: false },
    updateData,
    { returnDocument: "after" }
  );
  if (!updatedBed) throw new Error("Bed not found");

  await recalculateRoomStatus(updatedBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Updated Bed ${updatedBed.bedNumber}`,
    actionType: "UPDATE",
    entity: "Bed",
    targetId: updatedBed._id,
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedBed;
}

async function reserveBed(bedId, reservationDetails = {}, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const bed = await Bed.findOne({ _id: bedId, hostelId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot reserve Bed ${bed.bedNumber} because it is currently occupied by a resident`);
  }

  const updatedBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: false, status: { $nin: ["Occupied", "occupied"] } },
    { status: "Reserved", ...(reservationDetails.description ? { description: reservationDetails.description } : {}) },
    { returnDocument: "after" }
  );
  if (!updatedBed) throw new Error("Bed not found or already occupied");

  await recalculateRoomStatus(updatedBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Reserved Bed ${updatedBed.bedNumber}`,
    actionType: "RESERVE",
    entity: "Bed",
    targetId: updatedBed._id,
    ipAddress: userContext.ip,
  });

  return updatedBed;
}

async function releaseBed(bedId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const bed = await Bed.findOne({ _id: bedId, hostelId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot release occupied bed directly. Please check out the resident first.`);
  }

  const updatedBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: false, status: { $nin: ["Occupied", "occupied"] } },
    { status: "Vacant", residentId: null },
    { returnDocument: "after" }
  );
  if (!updatedBed) throw new Error("Bed not found or occupied");

  await recalculateRoomStatus(updatedBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Released Bed ${updatedBed.bedNumber} to Vacant`,
    actionType: "RELEASE",
    entity: "Bed",
    targetId: updatedBed._id,
    ipAddress: userContext.ip,
  });

  return updatedBed;
}

async function setBedMaintenance(bedId, reason = "", userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const bed = await Bed.findOne({ _id: bedId, hostelId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot put Bed ${bed.bedNumber} into maintenance mode while occupied`);
  }

  const updatedBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: false, status: { $nin: ["Occupied", "occupied"] } },
    { status: "Maintenance", ...(reason ? { description: reason } : {}) },
    { returnDocument: "after" }
  );
  if (!updatedBed) throw new Error("Bed not found or occupied");

  await recalculateRoomStatus(updatedBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Set Bed ${updatedBed.bedNumber} to Maintenance mode`,
    actionType: "MAINTENANCE",
    entity: "Bed",
    targetId: updatedBed._id,
    details: { reason },
    ipAddress: userContext.ip,
  });

  return updatedBed;
}

async function softDeleteBed(bedId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const bed = await Bed.findOne({ _id: bedId, hostelId, isDeleted: false });
  if (!bed) throw new Error("Bed not found");

  if (bed.status === "Occupied" || bed.status === "occupied" || bed.residentId) {
    throw new Error(`Cannot delete Bed ${bed.bedNumber} because a resident is currently assigned to it`);
  }

  const deletedBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: false, status: { $nin: ["Occupied", "occupied"] } },
    { isDeleted: true, deletedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!deletedBed) throw new Error("Bed not found or occupied");

  await recalculateRoomStatus(deletedBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Soft deleted Bed ${deletedBed.bedNumber}`,
    actionType: "DELETE",
    entity: "Bed",
    targetId: deletedBed._id,
    ipAddress: userContext.ip,
  });

  return deletedBed;
}

async function restoreBed(bedId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const restoredBed = await Bed.findOneAndUpdate(
    { _id: bedId, hostelId, isDeleted: true },
    { isDeleted: false, deletedAt: null, status: "Vacant" },
    { returnDocument: "after" }
  );
  if (!restoredBed) throw new Error("Bed not found or not deleted");

  await recalculateRoomStatus(restoredBed.roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Restored Bed ${restoredBed.bedNumber}`,
    actionType: "RESTORE",
    entity: "Bed",
    targetId: restoredBed._id,
    ipAddress: userContext.ip,
  });

  return restoredBed;
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
