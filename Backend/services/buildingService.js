const Building = require("../models/Building");
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
      entity: entity || "Building",
      targetId,
      targetModel: "Building",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording building audit log:", err);
  }
}

async function createBuilding(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Check duplicate building code within this hostel
  const existing = await Building.findOne({ hostelId, buildingCode: data.buildingCode, isDeleted: false });
  if (existing) {
    throw new Error(`Building with code ${data.buildingCode} already exists`);
  }

  const building = await Building.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Building ${building.buildingName} (${building.buildingCode})`,
    actionType: "CREATE",
    entity: "Building",
    targetId: building._id,
    details: { buildingName: building.buildingName, buildingCode: building.buildingCode },
    ipAddress: userContext.ip,
  });

  return building;
}

async function updateBuilding(buildingId, updateData, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const building = await Building.findOne({ _id: buildingId, hostelId, isDeleted: false });
  if (!building) throw new Error("Building not found in active hostel");

  // Check duplicate building code if buildingCode is changed
  if (updateData.buildingCode && updateData.buildingCode !== building.buildingCode) {
    const duplicate = await Building.findOne({
      _id: { $ne: buildingId },
      hostelId,
      buildingCode: updateData.buildingCode,
      isDeleted: false,
    });
    if (duplicate) {
      throw new Error(`Building with code ${updateData.buildingCode} already exists`);
    }
  }

  updateData.updatedBy = userContext.userId;
  const updatedBuilding = await Building.findOneAndUpdate(
    { _id: buildingId, hostelId, isDeleted: false },
    updateData,
    { returnDocument: "after" }
  );

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Updated Building ${updatedBuilding.buildingName}`,
    actionType: "UPDATE",
    entity: "Building",
    targetId: building._id,
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedBuilding;
}

async function softDeleteBuilding(buildingId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const building = await Building.findOne({ _id: buildingId, hostelId, isDeleted: false });
  if (!building) throw new Error("Building not found in active hostel");

  // Safety check 1: Cannot delete building if it contains active floors
  const activeFloorsCount = await Floor.countDocuments({ buildingId, hostelId, isDeleted: false });
  if (activeFloorsCount > 0) {
    throw new Error(`Cannot delete building '${building.buildingName}' because it contains ${activeFloorsCount} active floor(s). Delete or reassign floors first.`);
  }

  // Safety check 2: Cannot delete building if it contains active rooms
  const activeRoomsCount = await Room.countDocuments({ buildingId, hostelId, isDeleted: false });
  if (activeRoomsCount > 0) {
    throw new Error(`Cannot delete building '${building.buildingName}' because it contains ${activeRoomsCount} active room(s). Delete or reassign rooms first.`);
  }

  // Safety check 3: Cannot delete building if it contains rooms with active residents
  const rooms = await Room.find({ buildingId, hostelId, isDeleted: false });
  const roomIds = rooms.map((r) => r._id);
  const activeResidentsCount = await Resident.countDocuments({
    roomId: { $in: roomIds },
    hostelId,
    status: { $in: ["Active", "active"] },
    isDeleted: false,
  });

  if (activeResidentsCount > 0) {
    throw new Error(`Cannot delete building '${building.buildingName}' because it has ${activeResidentsCount} active resident(s) staying in its rooms`);
  }

  building.isDeleted = true;
  building.deletedAt = new Date();
  building.status = "Inactive";
  await building.save();

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Soft deleted Building ${building.buildingName}`,
    actionType: "DELETE",
    entity: "Building",
    targetId: building._id,
    ipAddress: userContext.ip,
  });

  return building;
}

async function restoreBuilding(buildingId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const building = await Building.findOne({ _id: buildingId, hostelId, isDeleted: true });
  if (!building) throw new Error("Building not found or not deleted in active hostel");

  building.isDeleted = false;
  building.deletedAt = null;
  building.status = "Active";
  await building.save();

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Restored Building ${building.buildingName}`,
    actionType: "RESTORE",
    entity: "Building",
    targetId: building._id,
    ipAddress: userContext.ip,
  });

  return building;
}

async function getBuildingsList(hostelId, isDeleted = false) {
  if (!hostelId) return [];
  const query = { hostelId, isDeleted: isDeleted === true || isDeleted === "true" };
  return await Building.find(query).sort({ createdAt: -1 });
}

async function getBuildingStatistics(hostelId) {
  const [total, active, maintenance, deleted] = await Promise.all([
    Building.countDocuments({ hostelId, isDeleted: false }),
    Building.countDocuments({ hostelId, isDeleted: false, status: "Active" }),
    Building.countDocuments({ hostelId, isDeleted: false, status: "Under Maintenance" }),
    Building.countDocuments({ hostelId, isDeleted: true }),
  ]);

  return { totalBuildings: total, activeBuildings: active, maintenanceBuildings: maintenance, deletedBuildings: deleted };
}

module.exports = {
  createBuilding,
  updateBuilding,
  softDeleteBuilding,
  restoreBuilding,
  getBuildingsList,
  getBuildingStatistics,
};
