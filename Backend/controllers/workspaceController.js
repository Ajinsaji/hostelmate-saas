const Owner = require("../models/Owner");
const Workspace = require("../models/Workspace");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const StorageUsage = require("../models/StorageUsage");
const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const EventBus = require("../services/EventBus");
const mongoose = require("mongoose");

// Get active context
const getActiveContext = async (req, res) => {
  try {
    const ownerId = req.context.ownerId;
    const owner = await Owner.findById(ownerId).select("activeWorkspaceId activeHostelId lastVisitedPage").lean();
    
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    res.status(200).json({
      success: true,
      activeContext: {
        activeWorkspaceId: owner.activeWorkspaceId || req.context.workspaceId,
        activeHostelId: owner.activeHostelId || req.context.hostelId,
        lastVisitedPage: owner.lastVisitedPage || "",
      },
    });
  } catch (error) {
    console.error("getActiveContext error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Update active context
const updateActiveContext = async (req, res) => {
  try {
    const ownerId = req.context.ownerId;
    const { activeWorkspaceId, activeHostelId, lastVisitedPage } = req.body;

    const updates = {};
    if (activeWorkspaceId) updates.activeWorkspaceId = activeWorkspaceId;
    if (activeHostelId) updates.activeHostelId = activeHostelId;
    if (lastVisitedPage !== undefined) updates.lastVisitedPage = lastVisitedPage;

    const owner = await Owner.findByIdAndUpdate(ownerId, updates, { new: true })
      .select("activeWorkspaceId activeHostelId lastVisitedPage")
      .lean();

    // Emit HOSTEL_SWITCHED event
    EventBus.emit("HOSTEL_SWITCHED", {
      workspaceId: owner.activeWorkspaceId || req.context.workspaceId,
      hostelId: owner.activeHostelId,
      ownerId,
    });

    res.status(200).json({
      success: true,
      message: "Active context updated successfully",
      activeContext: {
        activeWorkspaceId: owner.activeWorkspaceId,
        activeHostelId: owner.activeHostelId,
        lastVisitedPage: owner.lastVisitedPage,
      },
    });
  } catch (error) {
    console.error("updateActiveContext error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Get workspace overview (Pro / Enterprise users)
const getWorkspaceOverview = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID is required" });
    }

    const hostels = await Hostel.find({ workspaceId }).lean();
    const hostelIds = hostels.map((h) => h._id);

    // Aggregate statistics across all hostels
    const [
      residentsCount,
      roomStatsAgg,
      paymentStatsAgg,
      storageUsage
    ] = await Promise.all([
      Resident.countDocuments({ hostelId: { $in: hostelIds }, status: "active" }),
      Room.aggregate([
        { $match: { hostelId: { $in: hostelIds } } },
        { $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            totalBeds: { $sum: "$totalBeds" },
            occupiedBeds: { $sum: "$occupiedBeds" }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { hostelId: { $in: hostelIds } } },
        { $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $in: ["$status", ["completed", "success"]] }, "$paidAmount", 0]
              }
            }
          }
        }
      ]),
      StorageUsage.findOne({ workspaceId }).lean()
    ]);

    const roomStats = roomStatsAgg[0] || { totalRooms: 0, totalBeds: 0, occupiedBeds: 0 };
    const paymentStats = paymentStatsAgg[0] || { totalRevenue: 0 };

    const totalBeds = roomStats.totalBeds || 0;
    const occupiedBeds = roomStats.occupiedBeds || 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    // Get individual stats for each hostel to render Hostel Cards
    const hostelCards = await Promise.all(
      hostels.map(async (hostel) => {
        const [hResidents, hRooms] = await Promise.all([
          Resident.countDocuments({ hostelId: hostel._id, status: "active" }),
          Room.aggregate([
            { $match: { hostelId: hostel._id } },
            { $group: {
                _id: null,
                totalRooms: { $sum: 1 },
                totalBeds: { $sum: "$totalBeds" },
                occupiedBeds: { $sum: "$occupiedBeds" }
              }
            }
          ])
        ]);

        const hRoomStats = hRooms[0] || { totalRooms: 0, totalBeds: 0, occupiedBeds: 0 };
        const hOccupancy = hRoomStats.totalBeds > 0 ? Math.round((hRoomStats.occupiedBeds / hRoomStats.totalBeds) * 100) : 0;

        return {
          _id: hostel._id,
          name: hostel.hostelName || hostel.name,
          address: hostel.address,
          residents: hResidents,
          rooms: hRoomStats.totalRooms,
          occupancy: hOccupancy,
        };
      })
    );

    res.status(200).json({
      success: true,
      workspace: {
        id: workspaceId,
        hostelsCount: hostels.length,
        residents: residentsCount,
        rooms: roomStats.totalRooms,
        occupancyRate,
        revenue: paymentStats.totalRevenue,
        storageUsed: storageUsage ? storageUsage.usedBytes : 0,
      },
      hostels: hostelCards,
    });
  } catch (error) {
    console.error("getWorkspaceOverview error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// List hostels in workspace
const listWorkspaceHostels = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    const hostels = await Hostel.find({ workspaceId }).lean();
    res.status(200).json({ success: true, hostels });
  } catch (error) {
    console.error("listWorkspaceHostels error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Create a new hostel inside workspace
const createWorkspaceHostel = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    const { name, address, city, state, district, pincode, hostelType } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Hostel name is required" });
    }

    // Backend Feature Gate Enforcement via BusinessRuleEngine
    const gate = await BusinessRuleEngine.canCreateHostel(workspaceId);
    if (!gate.allowed) {
      return res.status(403).json({
        success: false,
        message: gate.message || "Hostel limit reached for your plan. Upgrade required.",
        limitDetails: gate,
      });
    }

    // Generate unique slug
    let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    let slug = baseSlug;
    let counter = 1;
    while (await Hostel.findOne({ slug })) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const publicLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/hostel/${slug}`;
    const publicRegistrationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/hostel/${slug}/apply`;

    const newHostel = await Hostel.create({
      workspaceId,
      ownerId: req.context.ownerId,
      hostelName: name,
      name,
      address: address || "",
      city: city || "",
      state: state || "",
      district: district || "",
      pincode: pincode || "",
      hostelType: hostelType || "",
      slug,
      publicLink,
      publicRegistrationLink,
      status: "active",
      pendingActivation: false, // Owner creates it, so it starts active
    });

    // Update storage usage breakdown
    await StorageUsage.findOneAndUpdate(
      { workspaceId },
      { $push: { hostelBreakdown: { hostelId: newHostel._id, usedBytes: 0 } } }
    );

    // Emit HOSTEL_CREATED event
    EventBus.emit("HOSTEL_CREATED", {
      workspaceId,
      hostelId: newHostel._id,
      ownerId: req.context.ownerId,
      name,
    });

    res.status(201).json({
      success: true,
      message: "Hostel added successfully to your workspace.",
      hostel: newHostel,
    });
  } catch (error) {
    console.error("createWorkspaceHostel error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getActiveContext,
  updateActiveContext,
  getWorkspaceOverview,
  listWorkspaceHostels,
  createWorkspaceHostel,
};
