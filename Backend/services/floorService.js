const Floor = require("../models/Floor");
const Building = require("../models/Building");
const Room = require("../models/Room");
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
      entity: entity || "Floor",
      targetId,
      targetModel: "Floor",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording floor audit log:", err);
  }
}

async function createFloor(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!data.buildingId) throw new Error("Building ID is required");

  // Verify that parent building belongs to this active hostel
  const building = await Building.findOne({ _id: data.buildingId, hostelId, isDeleted: false });
  if (!building) {
    throw new Error("Referenced building not found in active hostel");
  }

  // Check duplicate floor number in building
  const existing = await Floor.findOne({ buildingId: data.buildingId, floorNumber: data.floorNumber, isDeleted: false });
  if (existing) {
    throw new Error(`Floor number ${data.floorNumber} already exists in this building`);
  }

  const floor = await Floor.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Floor ${floor.floorName} (Floor ${floor.floorNumber})`,
    actionType: "CREATE",
    entity: "Floor",
    targetId: floor._id,
    details: { floorName: floor.floorName, floorNumber: floor.floorNumber },
    ipAddress: userContext.ip,
  });

  return floor;
}

async function updateFloor(floorId, updateData, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const floor = await Floor.findOne({ _id: floorId, hostelId, isDeleted: false });
  if (!floor) throw new Error("Floor not found in active hostel");

  // If changing buildingId, verify target building belongs to this hostel
  if (updateData.buildingId && updateData.buildingId.toString() !== floor.buildingId.toString()) {
    const targetBuilding = await Building.findOne({ _id: updateData.buildingId, hostelId, isDeleted: false });
    if (!targetBuilding) {
      throw new Error("Target building not found in active hostel");
    }
  }

  // If changing floorNumber or buildingId, verify no duplicate
  const targetBuildingId = updateData.buildingId || floor.buildingId;
  const targetFloorNum = updateData.floorNumber !== undefined ? updateData.floorNumber : floor.floorNumber;
  if (
    (updateData.floorNumber !== undefined && updateData.floorNumber !== floor.floorNumber) ||
    (updateData.buildingId && updateData.buildingId.toString() !== floor.buildingId.toString())
  ) {
    const duplicate = await Floor.findOne({
      _id: { $ne: floorId },
      buildingId: targetBuildingId,
      floorNumber: targetFloorNum,
      isDeleted: false,
    });
    if (duplicate) {
      throw new Error(`Floor number ${targetFloorNum} already exists in this building`);
    }
  }

  updateData.updatedBy = userContext.userId;
  const updatedFloor = await Floor.findOneAndUpdate(
    { _id: floorId, hostelId, isDeleted: false },
    updateData,
    { returnDocument: "after" }
  );

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Updated Floor ${updatedFloor.floorName}`,
    actionType: "UPDATE",
    entity: "Floor",
    targetId: floor._id,
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedFloor;
}

async function softDeleteFloor(floorId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const floor = await Floor.findOne({ _id: floorId, hostelId, isDeleted: false });
  if (!floor) throw new Error("Floor not found in active hostel");

  // Safety check 1: Cannot delete floor if it contains active rooms
  const activeRoomsCount = await Room.countDocuments({ floorId, hostelId, isDeleted: false });
  if (activeRoomsCount > 0) {
    throw new Error(`Cannot delete floor '${floor.floorName}' because it contains ${activeRoomsCount} active room(s). Delete or reassign rooms first.`);
  }

  // Safety check 2: Cannot delete floor if it contains rooms with active residents
  const rooms = await Room.find({ floorId, hostelId, isDeleted: false });
  const roomIds = rooms.map((r) => r._id);
  const activeResidentsCount = await Resident.countDocuments({
    roomId: { $in: roomIds },
    hostelId,
    status: { $in: ["Active", "active"] },
    isDeleted: false,
  });

  if (activeResidentsCount > 0) {
    throw new Error(`Cannot delete floor '${floor.floorName}' because it has ${activeResidentsCount} active resident(s) staying in its rooms`);
  }

  floor.isDeleted = true;
  floor.deletedAt = new Date();
  floor.status = "Inactive";
  await floor.save();

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Soft deleted Floor ${floor.floorName}`,
    actionType: "DELETE",
    entity: "Floor",
    targetId: floor._id,
    ipAddress: userContext.ip,
  });

  return floor;
}

async function restoreFloor(floorId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const floor = await Floor.findOne({ _id: floorId, hostelId, isDeleted: true });
  if (!floor) throw new Error("Floor not found or not deleted in active hostel");

  floor.isDeleted = false;
  floor.deletedAt = null;
  floor.status = "Active";
  await floor.save();

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Restored Floor ${floor.floorName}`,
    actionType: "RESTORE",
    entity: "Floor",
    targetId: floor._id,
    ipAddress: userContext.ip,
  });

  return floor;
}

async function getFloorsList({ hostelId, buildingId, isDeleted = false }) {
  if (!hostelId) return [];
  const query = { hostelId, isDeleted: isDeleted === true || isDeleted === "true" };
  if (buildingId) query.buildingId = buildingId;
  return await Floor.find(query).populate("buildingId", "buildingName buildingCode").sort({ floorNumber: 1 });
}

async function getFloorStatistics(hostelId) {
  const [total, active, maintenance, deleted] = await Promise.all([
    Floor.countDocuments({ hostelId, isDeleted: false }),
    Floor.countDocuments({ hostelId, isDeleted: false, status: "Active" }),
    Floor.countDocuments({ hostelId, isDeleted: false, status: "Under Maintenance" }),
    Floor.countDocuments({ hostelId, isDeleted: true }),
  ]);

  return { totalFloors: total, activeFloors: active, maintenanceFloors: maintenance, deletedFloors: deleted };
}

module.exports = {
  createFloor,
  updateFloor,
  softDeleteFloor,
  restoreFloor,
  getFloorsList,
  getFloorStatistics,
};
