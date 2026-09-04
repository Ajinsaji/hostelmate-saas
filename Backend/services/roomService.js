const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const Building = require("../models/Building");
const Floor = require("../models/Floor");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function recordAuditLog({ hostelId, userId, action, actionType, entity, targetId, details, ipAddress }) {
  try {
    await AuditLog.create({
      hostelId,
      userId: userId || null,
      action,
      actionType,
      entity: entity || "Room",
      targetId,
      targetModel: "Room",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording room audit log:", err);
  }
}

/**
 * Automatically recalculates and updates a room's occupancy status and bed counts
 */
async function recalculateRoomStatus(roomId) {
  const room = await Room.findById(roomId);
  if (!room) return null;

  const beds = await Bed.find({ roomId, isDeleted: false });
  const occupiedCount = beds.filter((b) => b.status === "Occupied" || b.status === "occupied" || b.residentId).length;

  room.occupiedBeds = occupiedCount;
  room.capacity = room.capacity || room.totalBeds || beds.length || 1;
  room.totalBeds = room.capacity;
  room.vacantBeds = Math.max(0, room.capacity - occupiedCount);

  if (room.status !== "Under Maintenance" && room.status !== "Cleaning") {
    if (occupiedCount === 0) {
      room.status = "Vacant";
    } else if (occupiedCount >= room.capacity) {
      room.status = "Fully Occupied";
    } else {
      room.status = "Partially Occupied";
    }
  }

  await room.save();
  return room;
}

/**
 * Create Room and auto-generate Beds for capacity
 */
async function createRoom(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Check duplicate room number
  const existing = await Room.findOne({ hostelId, roomNumber: data.roomNumber, isDeleted: false });
  if (existing) {
    const dupErr = new Error("Room already exists.");
    dupErr.code = 11000;
    throw dupErr;
  }

  // Safely handle optional buildingId and floorId before Mongoose ObjectId casting
  let buildingId = data.buildingId;
  if (!buildingId || buildingId === "" || buildingId === "null" || buildingId === "undefined") {
    buildingId = null;
  }

  let floorId = data.floorId;
  if (!floorId || floorId === "" || floorId === "null" || floorId === "undefined") {
    floorId = null;
  }

  // Safely normalize numeric fields
  const capacity = Math.max(1, parseInt(data.capacity || data.totalBeds, 10) || 2);
  const monthlyRent = Math.max(0, parseFloat(data.monthlyRent) || parseFloat(data.rentPerBed) || 0);
  const securityDeposit = Math.max(0, parseFloat(data.securityDeposit) || 0);
  const rentPerBed = data.rentPerBed !== undefined && data.rentPerBed !== null && data.rentPerBed !== ""
    ? Math.max(0, parseFloat(data.rentPerBed) || 0)
    : monthlyRent;

  const room = await Room.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    buildingId,
    floorId,
    capacity,
    totalBeds: capacity,
    occupiedBeds: 0,
    vacantBeds: capacity,
    monthlyRent,
    rentPerBed,
    securityDeposit,
    status: data.status || "Vacant",
    createdBy: userContext.userId,
  });

  // Auto-generate beds (e.g. Bed 101-A, 101-B, 101-C)
  const bedLetters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
  const bedDocs = [];
  for (let i = 0; i < capacity; i++) {
    const suffix = bedLetters[i] || `${i + 1}`;
    const bedNumber = `${room.roomNumber}-${suffix}`;
    bedDocs.push({
      tenantId: hostelId,
      hostelId,
      buildingId: room.buildingId,
      floorId: room.floorId,
      roomId: room._id,
      bedNumber,
      bedCode: `${room.roomNumber}_${bedNumber}`,
      status: "Vacant",
      createdBy: userContext.userId,
    });
  }

  if (bedDocs.length > 0) {
    await Bed.insertMany(bedDocs);
  }

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Room ${room.roomNumber} with ${capacity} auto-generated beds`,
    actionType: "CREATE",
    entity: "Room",
    targetId: room._id,
    details: { roomNumber: room.roomNumber, capacity },
    ipAddress: userContext.ip,
  });

  return room;
}

/**
 * Update Room details
 */
async function updateRoom(roomId, updateData, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  updateData.updatedBy = userContext.userId;
  const updatedRoom = await Room.findOneAndUpdate(
    { _id: roomId, hostelId, isDeleted: false },
    updateData,
    { returnDocument: "after" }
  );
  if (!updatedRoom) throw new Error("Room not found");

  await recalculateRoomStatus(roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Updated Room ${updatedRoom.roomNumber}`,
    actionType: "UPDATE",
    entity: "Room",
    targetId: updatedRoom._id,
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedRoom;
}

/**
 * Soft Delete Room (Safety check: Cannot delete if occupied)
 */
async function softDeleteRoom(roomId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const room = await Room.findOne({ _id: roomId, hostelId, isDeleted: false });
  if (!room) throw new Error("Room not found");

  // Safety check: Cannot delete room if it has active residents
  const activeResidentsCount = await Resident.countDocuments({
    roomId,
    hostelId,
    status: { $in: ["Active", "active"] },
    isDeleted: false,
  });

  if (activeResidentsCount > 0) {
    throw new Error(`Cannot delete room '${room.roomNumber}' because it has ${activeResidentsCount} active resident(s) staying in it`);
  }

  const deletedRoom = await Room.findOneAndUpdate(
    { _id: roomId, hostelId, isDeleted: false },
    { isDeleted: true, deletedAt: new Date() },
    { returnDocument: "after" }
  );
  if (!deletedRoom) throw new Error("Room not found");

  // Soft delete associated vacant beds in this hostel
  await Bed.updateMany({ roomId, hostelId }, { isDeleted: true, deletedAt: new Date() });

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Soft deleted Room ${room.roomNumber}`,
    actionType: "DELETE",
    entity: "Room",
    targetId: room._id,
    ipAddress: userContext.ip,
  });

  return deletedRoom;
}

/**
 * Restore Soft Deleted Room
 */
async function restoreRoom(roomId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const restoredRoom = await Room.findOneAndUpdate(
    { _id: roomId, hostelId, isDeleted: true },
    { isDeleted: false, deletedAt: null },
    { returnDocument: "after" }
  );
  if (!restoredRoom) throw new Error("Room not found or not deleted");

  await Bed.updateMany({ roomId, hostelId }, { isDeleted: false, deletedAt: null });
  await recalculateRoomStatus(roomId);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Restored Room ${restoredRoom.roomNumber}`,
    actionType: "RESTORE",
    entity: "Room",
    targetId: restoredRoom._id,
    ipAddress: userContext.ip,
  });

  return restoredRoom;
}

/**
 * Filtered Room List & Search
 */
async function getRoomsList({ hostelId, buildingId, floorId, status, roomType, gender, search, isDeleted = false, page = 1, limit = 50 }) {
  const query = { hostelId, isDeleted: isDeleted === true || isDeleted === "true" };

  if (buildingId) query.buildingId = buildingId;
  if (floorId) query.floorId = floorId;
  if (status) query.status = status;
  if (roomType) query.roomType = roomType;
  if (gender) query.gender = gender;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [{ roomNumber: searchRegex }, { roomName: searchRegex }, { floor: searchRegex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [rooms, total] = await Promise.all([
    Room.find(query)
      .populate("buildingId", "buildingName buildingCode")
      .populate("floorId", "floorName floorNumber")
      .sort({ roomNumber: 1 })
      .skip(skip)
      .limit(limitNum),
    Room.countDocuments(query),
  ]);

  return {
    rooms,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

/**
 * Get Room Statistics
 */
async function getRoomStatistics(hostelId) {
  const [total, vacant, partially, fully, maintenance] = await Promise.all([
    Room.countDocuments({ hostelId, isDeleted: false }),
    Room.countDocuments({ hostelId, isDeleted: false, status: "Vacant" }),
    Room.countDocuments({ hostelId, isDeleted: false, status: "Partially Occupied" }),
    Room.countDocuments({ hostelId, isDeleted: false, status: "Fully Occupied" }),
    Room.countDocuments({ hostelId, isDeleted: false, status: "Under Maintenance" }),
  ]);

  return {
    totalRooms: total,
    vacantRooms: vacant,
    partiallyOccupiedRooms: partially,
    fullyOccupiedRooms: fully,
    maintenanceRooms: maintenance,
  };
}

module.exports = {
  createRoom,
  updateRoom,
  softDeleteRoom,
  restoreRoom,
  getRoomsList,
  getRoomStatistics,
  recalculateRoomStatus,
};
