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
  
  let admissionNumber = "";
  let attempts = 0;
  while (!admissionNumber && attempts < 10) {
    attempts++;
    const uniqueSuffix = `${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 900)}`;
    const candidate = `ADM-${yearMonth}-${String(count + attempts).padStart(4, "0")}-${uniqueSuffix}`;
    const existing = await Resident.findOne({ admissionNumber: candidate });
    if (!existing) {
      admissionNumber = candidate;
    }
  }

  return admissionNumber || `ADM-${yearMonth}-${Date.now()}`;
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
/**
 * Update Resident Profile
 */
async function updateResident(residentId, updateData, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const oldValue = resident.toObject();

  if (updateData.firstName || updateData.lastName) {
    const fn = updateData.firstName || resident.firstName;
    const ln = updateData.lastName !== undefined ? updateData.lastName : resident.lastName;
    updateData.fullName = `${fn} ${ln}`.trim();
    updateData.name = updateData.fullName;
  }

  updateData.updatedBy = userContext.userId || null;

  const updatedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    updateData,
    { returnDocument: "after" }
  );
  if (!updatedResident) throw new Error("Resident not found");

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Updated profile for resident ${updatedResident.fullName}`,
    actionType: "UPDATE",
    entity: "Resident",
    targetId: updatedResident._id,
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
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");
  if (resident.isDeleted) throw new Error("Resident is already deleted");

  // If resident was occupying a bed, release bed & update room occupancy
  if (resident.bedId) {
    await Bed.findOneAndUpdate(
      { _id: resident.bedId, hostelId },
      { $set: { status: "vacant", residentId: null } }
    );
    if (resident.roomId) {
      const oldRoom = await Room.findOne({ _id: resident.roomId, hostelId });
      if (oldRoom && oldRoom.occupiedBeds > 0) {
        oldRoom.occupiedBeds -= 1;
        await oldRoom.save();
      }
    }
  }

  const deletedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false,
        roomId: null,
        bedId: null,
      }
    },
    { returnDocument: "after" }
  );
  if (!deletedResident) throw new Error("Resident not found");

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Soft deleted resident ${resident.fullName}`,
    actionType: "DELETE",
    entity: "Resident",
    targetId: resident._id,
    oldValue: { isDeleted: false },
    newValue: { isDeleted: true, deletedAt: deletedResident.deletedAt },
    details: { reason: "Soft Delete Requested" },
    ipAddress: userContext.ip,
  });

  return deletedResident;
}

/**
 * Restore Soft Deleted Resident
 */
async function restoreResident(residentId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const restoredResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: true },
    {
      $set: {
        isDeleted: false,
        deletedAt: null,
        isActive: true,
        status: "Pending Admission",
      }
    },
    { returnDocument: "after" }
  );
  if (!restoredResident) throw new Error("Resident not found or not deleted");

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Restored resident ${restoredResident.fullName}`,
    actionType: "RESTORE",
    entity: "Resident",
    targetId: restoredResident._id,
    oldValue: { isDeleted: true },
    newValue: { isDeleted: false },
    ipAddress: userContext.ip,
  });

  return restoredResident;
}

/**
 * Check-In Workflow (Assigns bed & updates room occupancy)
 */
async function checkInResident({ residentId, roomId, bedId, checkInDate = new Date() }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  if (!roomId || !bedId) throw new Error("Room ID and Bed ID are required for check-in");

  const room = await Room.findOne({ _id: roomId, hostelId, isDeleted: false });
  if (!room) throw new Error("Target room not found");

  const bed = await Bed.findOne({ _id: bedId, roomId: room._id, hostelId, isDeleted: false });
  if (!bed) throw new Error("Target bed not found");

  // Atomic bed claim to prevent race conditions
  const claimedBed = await Bed.findOneAndUpdate(
    {
      _id: bedId,
      roomId: room._id,
      hostelId,
      $or: [{ status: { $in: ["Vacant", "vacant"] } }, { residentId: resident._id }]
    },
    { $set: { status: "Occupied", residentId: resident._id } },
    { returnDocument: "after" }
  );

  if (!claimedBed) {
    throw new Error(`Bed ${bed.bedNumber || "selected"} is already occupied by another resident`);
  }

  // Release previous bed if resident was in another bed
  if (resident.bedId && resident.bedId.toString() !== bedId.toString()) {
    await Bed.findOneAndUpdate(
      { _id: resident.bedId, hostelId },
      { $set: { status: "Vacant", residentId: null } }
    );
    if (resident.roomId && resident.roomId.toString() !== roomId.toString()) {
      const prevRoom = await Room.findOne({ _id: resident.roomId, hostelId });
      if (prevRoom && prevRoom.occupiedBeds > 0) {
        prevRoom.occupiedBeds -= 1;
        await prevRoom.save();
      }
    }
  }

  // Update new room occupancy
  if (!resident.bedId || resident.roomId?.toString() !== roomId.toString()) {
    room.occupiedBeds = (room.occupiedBeds || 0) + 1;
    await room.save();
  }

  const updatedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    {
      $set: {
        roomId: room._id,
        bedId: bed._id,
        checkInDate,
        status: "Active",
        isActive: true,
      }
    },
    { returnDocument: "after" }
  );

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Checked in resident ${updatedResident.fullName} to Room ${room.roomNumber}, Bed ${bed.bedNumber}`,
    actionType: "CHECK_IN",
    entity: "Resident",
    targetId: updatedResident._id,
    newValue: { roomId: room._id, bedId: bed._id, status: "Active", checkInDate },
    details: { roomNumber: room.roomNumber, bedNumber: bed.bedNumber },
    ipAddress: userContext.ip,
  });

  const EventBus = require("./EventBus");
  const Hostel = require("../models/Hostel");
  const hostel = await Hostel.findById(hostelId).select("hostelName").lean();

  EventBus.emit("ROOM_ASSIGNED", {
    workspaceId: userContext.workspaceId,
    hostelId,
    residentId: updatedResident._id,
    residentName: updatedResident.fullName || `${updatedResident.firstName || ""} ${updatedResident.lastName || ""}`.trim(),
    phone: updatedResident.phone,
    hostelName: hostel?.hostelName || "HostelMate",
    roomNumber: room.roomNumber,
    bedNumber: bed.bedNumber,
  });

  return updatedResident;
}

/**
 * Check-Out Workflow (Frees bed & decrements room occupancy)
 */
async function checkOutResident({ residentId, actualCheckoutDate = new Date(), remarks = "" }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  if (resident.status === "Checked Out") {
    throw new Error("Resident is already checked out");
  }

  // Free assigned bed
  if (resident.bedId) {
    await Bed.findOneAndUpdate(
      { _id: resident.bedId, hostelId },
      { $set: { status: "Vacant", residentId: null } }
    );
  }

  // Decrement room occupancy
  if (resident.roomId) {
    const room = await Room.findOne({ _id: resident.roomId, hostelId });
    if (room && room.occupiedBeds > 0) {
      room.occupiedBeds -= 1;
      await room.save();
    }
  }

  const updatedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    {
      $set: {
        status: "Checked Out",
        actualCheckoutDate,
        roomId: null,
        bedId: null,
        ...(remarks ? { remarks } : {})
      }
    },
    { returnDocument: "after" }
  );

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Checked out resident ${updatedResident.fullName}`,
    actionType: "CHECK_OUT",
    entity: "Resident",
    targetId: updatedResident._id,
    newValue: { status: "Checked Out", actualCheckoutDate, remarks },
    ipAddress: userContext.ip,
  });

  const EventBus = require("./EventBus");
  const Hostel = require("../models/Hostel");
  const hostel = await Hostel.findById(hostelId).select("hostelName").lean();

  EventBus.emit("RESIDENT_CHECKED_OUT", {
    workspaceId: userContext.workspaceId,
    hostelId,
    residentId: updatedResident._id,
    residentName: updatedResident.fullName || `${updatedResident.firstName || ""} ${updatedResident.lastName || ""}`.trim(),
    phone: updatedResident.phone,
    hostelName: hostel?.hostelName || "HostelMate",
    actualCheckoutDate,
  });

  return updatedResident;
}

/**
 * Room / Bed Transfer Workflow
 */
async function transferRoomOrBed({ residentId, newRoomId, newBedId, reason = "" }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const newRoom = await Room.findOne({ _id: newRoomId, hostelId, isDeleted: false });
  if (!newRoom) throw new Error("New room not found");

  const newBed = await Bed.findOne({ _id: newBedId, roomId: newRoom._id, hostelId, isDeleted: false });
  if (!newBed) throw new Error("New bed not found");

  // Atomic claim on new bed
  const claimedBed = await Bed.findOneAndUpdate(
    {
      _id: newBedId,
      roomId: newRoom._id,
      hostelId,
      $or: [{ status: { $in: ["Vacant", "vacant"] } }, { residentId: resident._id }]
    },
    { $set: { status: "Occupied", residentId: resident._id } },
    { returnDocument: "after" }
  );

  if (!claimedBed) {
    throw new Error(`Target bed ${newBed.bedNumber || ""} is already occupied`);
  }

  const oldRoomId = resident.roomId;
  const oldBedId = resident.bedId;

  // 1. Release old bed if changing beds
  if (oldBedId && oldBedId.toString() !== newBedId.toString()) {
    await Bed.findOneAndUpdate(
      { _id: oldBedId, hostelId },
      { $set: { status: "Vacant", residentId: null } }
    );
  }

  // 2. Decrement old room count & increment new room count
  if (oldRoomId && oldRoomId.toString() !== newRoomId.toString()) {
    const oldRoom = await Room.findOne({ _id: oldRoomId, hostelId });
    if (oldRoom && oldRoom.occupiedBeds > 0) {
      oldRoom.occupiedBeds -= 1;
      await oldRoom.save();
    }
    newRoom.occupiedBeds = (newRoom.occupiedBeds || 0) + 1;
    await newRoom.save();
  }

  const updatedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    {
      $set: {
        roomId: newRoom._id,
        bedId: newBed._id,
      }
    },
    { returnDocument: "after" }
  );

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Transferred resident ${updatedResident.fullName} to Room ${newRoom.roomNumber}, Bed ${newBed.bedNumber}`,
    actionType: "ROOM_BED_TRANSFER",
    entity: "Resident",
    targetId: updatedResident._id,
    oldValue: { roomId: oldRoomId, bedId: oldBedId },
    newValue: { roomId: newRoom._id, bedId: newBed._id, reason },
    ipAddress: userContext.ip,
  });

  try {
    const oldRoomDoc = oldRoomId ? await Room.findOne({ _id: oldRoomId, hostelId }).select("roomNumber").lean() : null;
    const oldBedDoc = oldBedId ? await Bed.findOne({ _id: oldBedId, hostelId }).select("bedNumber").lean() : null;
    const hostelDoc = await Hostel.findById(hostelId).select("hostelName name").lean();

    EventBus.emit("ROOM_TRANSFERRED", {
      residentId: updatedResident._id,
      hostelId,
      hostelName: hostelDoc?.hostelName || hostelDoc?.name || "HostelMate",
      residentName: updatedResident.fullName || `${updatedResident.firstName || ""} ${updatedResident.lastName || ""}`.trim(),
      phone: updatedResident.phone,
      oldRoom: oldRoomDoc?.roomNumber || "—",
      oldBed: oldBedDoc?.bedNumber || "—",
      newRoom: newRoom.roomNumber || "—",
      newBed: newBed.bedNumber || "—",
      effectiveDate: new Date(),
      referenceId: `TRANSFER_${updatedResident._id}_${Date.now()}`,
    });
  } catch (emitErr) {
    // Non-blocking notification emission
  }

  return updatedResident;
}

/**
 * Change Status Workflow
 */
async function changeResidentStatus({ residentId, newStatus, reason = "" }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const validStatuses = ["Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked"];
  if (!validStatuses.includes(newStatus)) {
    throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
  }

  const resident = await Resident.findOne({ _id: residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found");

  const oldStatus = resident.status;
  let remarks = resident.remarks || "";
  if (reason) remarks = `${remarks}\n[Status Change Reason]: ${reason}`.trim();

  const updatedResident = await Resident.findOneAndUpdate(
    { _id: residentId, hostelId, isDeleted: false },
    { $set: { status: newStatus, remarks } },
    { returnDocument: "after" }
  );
  if (!updatedResident) throw new Error("Resident not found");

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Changed status of resident ${updatedResident.fullName} from ${oldStatus} to ${newStatus}`,
    actionType: "STATUS_CHANGE",
    entity: "Resident",
    targetId: updatedResident._id,
    oldValue: { status: oldStatus },
    newValue: { status: newStatus, reason },
    ipAddress: userContext.ip,
  });

  return updatedResident;
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
