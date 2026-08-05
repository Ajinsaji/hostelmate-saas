const FeatureRegistry = require("./FeatureRegistry");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Staff = require("../models/Staff");
const StorageUsage = require("../models/StorageUsage");
const Room = require("../models/Room");

class BusinessRuleEngine {
  // 1. Can Create Hostel
  async canCreateHostel(workspaceId) {
    if (!workspaceId) return { allowed: true };
    const limit = await FeatureRegistry.limit(workspaceId, "hostel");
    const count = await Hostel.countDocuments({ workspaceId });
    const allowed = limit === 999999 || count < limit;
    return {
      allowed,
      limit,
      used: count,
      remaining: limit === 999999 ? "Unlimited" : Math.max(0, limit - count),
      message: allowed ? null : `Limit reached. Your plan allows a maximum of ${limit} hostel(s).`,
    };
  }

  // 2. Can Create Resident
  async canCreateResident(workspaceId) {
    if (!workspaceId) return { allowed: true };
    const limit = await FeatureRegistry.limit(workspaceId, "resident");
    
    // Get all hostels in workspace
    const hostels = await Hostel.find({ workspaceId }).select("_id").lean();
    const hostelIds = hostels.map(h => h._id);
    
    const count = await Resident.countDocuments({ hostelId: { $in: hostelIds }, status: "active" });
    const allowed = limit === 999999 || count < limit;
    return {
      allowed,
      limit,
      used: count,
      remaining: limit === 999999 ? "Unlimited" : Math.max(0, limit - count),
      message: allowed ? null : `Limit reached. Your plan allows a maximum of ${limit} residents.`,
    };
  }

  // 3. Can Invite Staff
  async canInviteStaff(workspaceId) {
    if (!workspaceId) return { allowed: true };
    const limit = await FeatureRegistry.limit(workspaceId, "staff");
    
    const hostels = await Hostel.find({ workspaceId }).select("_id").lean();
    const hostelIds = hostels.map(h => h._id);
    
    const count = await Staff.countDocuments({ hostelId: { $in: hostelIds }, isDeleted: false });
    const allowed = limit === 999999 || count < limit;
    return {
      allowed,
      limit,
      used: count,
      remaining: limit === 999999 ? "Unlimited" : Math.max(0, limit - count),
      message: allowed ? null : `Limit reached. Your plan allows a maximum of ${limit} staff members.`,
    };
  }

  // 4. Can Allocate Room
  async canAllocateRoom(roomId) {
    if (!roomId) return { allowed: true };
    const room = await Room.findById(roomId).lean();
    if (!room) return { allowed: false, message: "Target Room not found" };

    const totalBeds = room.totalBeds || 0;
    const occupiedBeds = room.occupiedBeds || 0;
    const allowed = occupiedBeds < totalBeds;
    return {
      allowed,
      limit: totalBeds,
      used: occupiedBeds,
      remaining: Math.max(0, totalBeds - occupiedBeds),
      message: allowed ? null : "Target room is fully occupied.",
    };
  }

  // 5. Can Create Payment
  async canCreatePayment(workspaceId) {
    return { allowed: true, message: null };
  }

  // 6. Can Create Expense
  async canCreateExpense(workspaceId) {
    return { allowed: true, message: null };
  }

  // 7. Can Create Complaint
  async canCreateComplaint(workspaceId) {
    return { allowed: true, message: null };
  }

  // 8. Can Upload Document (Checking Storage Policy Warning & Hard Limits)
  async canUploadDocument(workspaceId, bytesToAdd) {
    if (!workspaceId) return { allowed: true };
    const limit = await FeatureRegistry.limit(workspaceId, "storage");
    if (limit === 999999) return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited" };

    const storage = await StorageUsage.findOne({ workspaceId }).lean();
    const currentUsed = storage ? storage.usedBytes : 0;
    const projectedUsed = currentUsed + Number(bytesToAdd);
    const allowed = projectedUsed <= limit;

    return {
      allowed,
      limit,
      used: currentUsed,
      projected: projectedUsed,
      remaining: Math.max(0, limit - currentUsed),
      message: allowed ? null : `Storage upload denied. Exceeds your workspace storage capacity of ${(limit / (1024 * 1024 * 1024)).toFixed(1)} GB.`,
    };
  }
}

module.exports = new BusinessRuleEngine();
