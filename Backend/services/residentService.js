const Resident = require("../models/Resident");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

/**
 * Auto-generates unique sequential admission number: ADM-YYYYMM-XXXX
 */
async function generateAdmissionNumber(hostelId) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await Resident.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `ADM-${yearMonth}-${seq}`;
}

/**
 * Helper to record Audit Log entries
 */
async function recordAuditLog({ hostelId, userId, action, actionType, entity, targetId, oldValue, newValue, details, ipAddress }) {
  try {
    await AuditLog.create({
      hostelId,
      userId: userId || null,
      action,
      actionType,
      entity: entity || "Resident",
      targetId,
      targetModel: "Resident",
      oldValue,
      newValue,
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording audit log:", err);
  }
}

/**
 * Create new Resident (Admission)
 */
async function createResident(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Check duplicate phone
  if (data.phone) {
    const existingPhone = await Resident.findOne({ hostelId, phone: data.phone, isDeleted: false });
    if (existingPhone) {
      throw new Error(`Resident with phone number ${data.phone} already exists`);
    }
  }

  // Check duplicate Aadhaar if provided
  if (data.aadhaarNumber) {
    const existingAadhaar = await Resident.findOne({ hostelId, aadhaarNumber: data.aadhaarNumber, isDeleted: false });
    if (existingAadhaar) {
      throw new Error(`Resident with Aadhaar number ${data.aadhaarNumber} already exists`);
    }
  }

  const admissionNumber = data.admissionNumber || (await generateAdmissionNumber(hostelId));
  const firstName = data.firstName || data.name || "Resident";
  const lastName = data.lastName || "";
  const fullName = data.fullName || `${firstName} ${lastName}`.trim();

  const resident = await Resident.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    admissionNumber,
    firstName,
    lastName,
    fullName,
    name: fullName,
    status: data.status || "Pending Admission",
    joiningDate: data.joiningDate || data.joinDate || new Date(),
    createdBy: userContext.userId || null,
  });

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Admitted resident ${fullName} (${admissionNumber})`,
    actionType: "CREATE",
    entity: "Resident",
    targetId: resident._id,
    newValue: resident.toObject(),
    details: { admissionNumber, status: resident.status },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Update Resident Profile
 */
async function updateResident(residentId, updateData, userContext = {}) {
  const resident = await Resident.findOne({ _id: residentId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const oldValue = resident.toObject();

  if (updateData.firstName || updateData.lastName) {
    const fn = updateData.firstName || resident.firstName;
    const ln = updateData.lastName !== undefined ? updateData.lastName : resident.lastName;
    updateData.fullName = `${fn} ${ln}`.trim();
    updateData.name = updateData.fullName;
  }

  updateData.updatedBy = userContext.userId || null;

  const updatedResident = await Resident.findByIdAndUpdate(residentId, updateData, { new: true });

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Updated profile for resident ${updatedResident.fullName}`,
    actionType: "UPDATE",
    entity: "Resident",
    targetId: resident._id,
    oldValue,
    newValue: updatedResident.toObject(),
    details: updateData,
    ipAddress: userContext.ip,
  });

  return updatedResident;
}

/**
 * Soft Delete Resident (Preserves financial history, frees bed if assigned)
 */
async function softDeleteResident(residentId, userContext = {}) {
  const resident = await Resident.findById(residentId);
  if (!resident) throw new Error("Resident not found");
  if (resident.isDeleted) throw new Error("Resident is already deleted");

  // If resident was occupying a bed, release bed & update room occupancy
  if (resident.bedId) {
    const oldBed = await Bed.findById(resident.bedId);
    if (oldBed) {
      oldBed.status = "vacant";
      oldBed.residentId = null;
      await oldBed.save();
    }
    if (resident.roomId) {
      const oldRoom = await Room.findById(resident.roomId);
      if (oldRoom && oldRoom.occupiedBeds > 0) {
        oldRoom.occupiedBeds -= 1;
        await oldRoom.save();
      }
    }
  }

  resident.isDeleted = true;
  resident.deletedAt = new Date();
  resident.isActive = false;
  resident.roomId = null;
  resident.bedId = null;
  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Soft deleted resident ${resident.fullName}`,
    actionType: "DELETE",
    entity: "Resident",
    targetId: resident._id,
    oldValue: { isDeleted: false },
    newValue: { isDeleted: true, deletedAt: resident.deletedAt },
    details: { reason: "Soft Delete Requested" },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Restore Soft Deleted Resident
 */
async function restoreResident(residentId, userContext = {}) {
  const resident = await Resident.findById(residentId);
  if (!resident) throw new Error("Resident not found");
  if (!resident.isDeleted) throw new Error("Resident is active and not deleted");

  resident.isDeleted = false;
  resident.deletedAt = null;
  resident.isActive = true;
  resident.status = "Pending Admission";
  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Restored resident ${resident.fullName}`,
    actionType: "RESTORE",
    entity: "Resident",
    targetId: resident._id,
    oldValue: { isDeleted: true },
    newValue: { isDeleted: false },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Check-In Workflow (Assigns bed & updates room occupancy)
 */
async function checkInResident({ residentId, roomId, bedId, checkInDate = new Date() }, userContext = {}) {
  const resident = await Resident.findOne({ _id: residentId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  if (!roomId || !bedId) throw new Error("Room ID and Bed ID are required for check-in");

  const room = await Room.findById(roomId);
  if (!room) throw new Error("Target room not found");

  const bed = await Bed.findById(bedId);
  if (!bed) throw new Error("Target bed not found");

  if (bed.status === "occupied" && bed.residentId && bed.residentId.toString() !== residentId.toString()) {
    throw new Error(`Bed ${bed.bedNumber || "selected"} is already occupied by another resident`);
  }

  // Release previous bed if resident was in another bed
  if (resident.bedId && resident.bedId.toString() !== bedId.toString()) {
    const prevBed = await Bed.findById(resident.bedId);
    if (prevBed) {
      prevBed.status = "vacant";
      prevBed.residentId = null;
      await prevBed.save();
    }
    if (resident.roomId && resident.roomId.toString() !== roomId.toString()) {
      const prevRoom = await Room.findById(resident.roomId);
      if (prevRoom && prevRoom.occupiedBeds > 0) {
        prevRoom.occupiedBeds -= 1;
        await prevRoom.save();
      }
    }
  }

  // Claim new bed
  bed.status = "occupied";
  bed.residentId = resident._id;
  await bed.save();

  // Update new room occupancy
  if (!resident.bedId || resident.roomId?.toString() !== roomId.toString()) {
    room.occupiedBeds = (room.occupiedBeds || 0) + 1;
    await room.save();
  }

  resident.roomId = roomId;
  resident.bedId = bedId;
  resident.checkInDate = checkInDate;
  resident.status = "Active";
  resident.isActive = true;
  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Checked in resident ${resident.fullName} to Room ${room.roomNumber}, Bed ${bed.bedNumber}`,
    actionType: "CHECK_IN",
    entity: "Resident",
    targetId: resident._id,
    newValue: { roomId, bedId, status: "Active", checkInDate },
    details: { roomNumber: room.roomNumber, bedNumber: bed.bedNumber },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Check-Out Workflow (Frees bed & decrements room occupancy)
 */
async function checkOutResident({ residentId, actualCheckoutDate = new Date(), remarks = "" }, userContext = {}) {
  const resident = await Resident.findOne({ _id: residentId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  if (resident.status === "Checked Out") {
    throw new Error("Resident is already checked out");
  }

  // Free assigned bed
  if (resident.bedId) {
    const bed = await Bed.findById(resident.bedId);
    if (bed) {
      bed.status = "vacant";
      bed.residentId = null;
      await bed.save();
    }
  }

  // Decrement room occupancy
  if (resident.roomId) {
    const room = await Room.findById(resident.roomId);
    if (room && room.occupiedBeds > 0) {
      room.occupiedBeds -= 1;
      await room.save();
    }
  }

  resident.status = "Checked Out";
  resident.actualCheckoutDate = actualCheckoutDate;
  if (remarks) resident.remarks = remarks;
  resident.roomId = null;
  resident.bedId = null;
  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Checked out resident ${resident.fullName}`,
    actionType: "CHECK_OUT",
    entity: "Resident",
    targetId: resident._id,
    newValue: { status: "Checked Out", actualCheckoutDate, remarks },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Room / Bed Transfer Workflow
 */
async function transferRoomOrBed({ residentId, newRoomId, newBedId, reason = "" }, userContext = {}) {
  const resident = await Resident.findOne({ _id: residentId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const newRoom = await Room.findById(newRoomId);
  if (!newRoom) throw new Error("New room not found");

  const newBed = await Bed.findById(newBedId);
  if (!newBed) throw new Error("New bed not found");

  if (newBed.status === "occupied" && newBed.residentId && newBed.residentId.toString() !== residentId.toString()) {
    throw new Error(`Target bed ${newBed.bedNumber || ""} is already occupied`);
  }

  const oldRoomId = resident.roomId;
  const oldBedId = resident.bedId;

  // 1. Release old bed
  if (oldBedId) {
    const oldBed = await Bed.findById(oldBedId);
    if (oldBed) {
      oldBed.status = "vacant";
      oldBed.residentId = null;
      await oldBed.save();
    }
  }

  // 2. Decrement old room count
  if (oldRoomId && oldRoomId.toString() !== newRoomId.toString()) {
    const oldRoom = await Room.findById(oldRoomId);
    if (oldRoom && oldRoom.occupiedBeds > 0) {
      oldRoom.occupiedBeds -= 1;
      await oldRoom.save();
    }
    // Increment new room count
    newRoom.occupiedBeds = (newRoom.occupiedBeds || 0) + 1;
    await newRoom.save();
  }

  // 3. Claim new bed
  newBed.status = "occupied";
  newBed.residentId = resident._id;
  await newBed.save();

  resident.roomId = newRoomId;
  resident.bedId = newBedId;
  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Transferred resident ${resident.fullName} to Room ${newRoom.roomNumber}, Bed ${newBed.bedNumber}`,
    actionType: "ROOM_BED_TRANSFER",
    entity: "Resident",
    targetId: resident._id,
    oldValue: { roomId: oldRoomId, bedId: oldBedId },
    newValue: { roomId: newRoomId, bedId: newBedId, reason },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Change Status Workflow
 */
async function changeResidentStatus({ residentId, newStatus, reason = "" }, userContext = {}) {
  const validStatuses = ["Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const resident = await Resident.findOne({ _id: residentId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const oldStatus = resident.status;
  resident.status = newStatus;
  if (reason) resident.remarks = `${resident.remarks || ""}\n[Status Change Reason]: ${reason}`.trim();

  await resident.save();

  await recordAuditLog({
    hostelId: resident.hostelId,
    userId: userContext.userId,
    action: `Changed status of resident ${resident.fullName} from ${oldStatus} to ${newStatus}`,
    actionType: "STATUS_CHANGE",
    entity: "Resident",
    targetId: resident._id,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus, reason },
    ipAddress: userContext.ip,
  });

  return resident;
}

/**
 * Get Resident 360 Profile
 */
async function getResidentProfile(residentId, hostelId) {
  const resident = await Resident.findOne({ _id: residentId, hostelId })
    .populate("roomId")
    .populate("bedId");

  if (!resident) throw new Error("Resident not found");

  const auditHistory = await AuditLog.find({ targetId: residentId })
    .sort({ timestamp: -1 })
    .limit(50);

  return {
    resident,
    auditHistory,
  };
}

/**
 * Get Filtered & Paginated Residents List
 */
async function getResidentsList({ hostelId, page = 1, limit = 10, search = "", status, roomId, gender, foodPreference, isDeleted = false, sortBy = "createdAt", sortOrder = "desc" }) {
  const query = { hostelId };

  if (isDeleted === true || isDeleted === "true") {
    query.isDeleted = true;
  } else {
    query.isDeleted = false;
  }

  if (status) {
    query.status = status;
  }

  if (roomId) {
    query.roomId = roomId;
  }

  if (gender) {
    query.gender = new RegExp(`^${gender}$`, "i");
  }

  if (foodPreference) {
    query.foodPreference = foodPreference;
  }

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [
      { fullName: searchRegex },
      { firstName: searchRegex },
      { lastName: searchRegex },
      { admissionNumber: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { occupation: searchRegex },
      { college: searchRegex },
      { company: searchRegex },
    ];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [residents, total] = await Promise.all([
    Resident.find(query)
      .populate("roomId")
      .populate("bedId")
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum),
    Resident.countDocuments(query),
  ]);

  return {
    residents,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

/**
 * Get Resident Statistics Summary
 */
async function getResidentStatistics(hostelId) {
  const [total, active, pending, notice, checkedOut, blocked, deleted] = await Promise.all([
    Resident.countDocuments({ hostelId, isDeleted: false }),
    Resident.countDocuments({ hostelId, isDeleted: false, status: { $in: ["Active", "active"] } }),
    Resident.countDocuments({ hostelId, isDeleted: false, status: { $in: ["Pending Admission", "pending"] } }),
    Resident.countDocuments({ hostelId, isDeleted: false, status: "Notice Period" }),
    Resident.countDocuments({ hostelId, isDeleted: false, status: { $in: ["Checked Out", "checked_out"] } }),
    Resident.countDocuments({ hostelId, isDeleted: false, status: "Blocked" }),
    Resident.countDocuments({ hostelId, isDeleted: true }),
  ]);

  return {
    totalResidents: total,
    activeResidents: active,
    pendingAdmissions: pending,
    noticePeriod: notice,
    checkedOutResidents: checkedOut,
    blockedResidents: blocked,
    deletedResidents: deleted,
  };
}

module.exports = {
  generateAdmissionNumber,
  createResident,
  updateResident,
  softDeleteResident,
  restoreResident,
  checkInResident,
  checkOutResident,
  transferRoomOrBed,
  changeResidentStatus,
  getResidentProfile,
  getResidentsList,
  getResidentStatistics,
};
