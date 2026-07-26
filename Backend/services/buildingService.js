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

  // Check duplicate building code
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
  const building = await Building.findOne({ _id: buildingId, isDeleted: false });
  if (!building) throw new Error("Building not found");

  updateData.updatedBy = userContext.userId;
  const updatedBuilding = await Building.findByIdAndUpdate(buildingId, updateData, { new: true });

  await recordAuditLog({
    hostelId: building.hostelId,
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
  const building = await Building.findById(buildingId);
  if (!building) throw new Error("Building not found");

  // Safety check: Cannot delete building if it contains rooms with active residents
  const rooms = await Room.find({ buildingId, isDeleted: false });
  const roomIds = rooms.map((r) => r._id);
  const activeResidentsCount = await Resident.countDocuments({
    roomId: { $in: roomIds },
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
    hostelId: building.hostelId,
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
  const building = await Building.findById(buildingId);
  if (!building) throw new Error("Building not found");

  building.isDeleted = false;
  building.deletedAt = null;
  building.status = "Active";
  await building.save();

  await recordAuditLog({
    hostelId: building.hostelId,
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
