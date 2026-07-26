const Floor = require("../models/Floor");
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
  const floor = await Floor.findOne({ _id: floorId, isDeleted: false });
  if (!floor) throw new Error("Floor not found");

  updateData.updatedBy = userContext.userId;
  const updatedFloor = await Floor.findByIdAndUpdate(floorId, updateData, { new: true });

  await recordAuditLog({
    hostelId: floor.hostelId,
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
  const floor = await Floor.findById(floorId);
  if (!floor) throw new Error("Floor not found");

  // Safety check: Cannot delete floor if it contains active rooms with residents
  const rooms = await Room.find({ floorId, isDeleted: false });
  const roomIds = rooms.map((r) => r._id);
  const activeResidentsCount = await Resident.countDocuments({
    roomId: { $in: roomIds },
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
    hostelId: floor.hostelId,
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
  const floor = await Floor.findById(floorId);
  if (!floor) throw new Error("Floor not found");

  floor.isDeleted = false;
  floor.deletedAt = null;
  floor.status = "Active";
  await floor.save();

  await recordAuditLog({
    hostelId: floor.hostelId,
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
