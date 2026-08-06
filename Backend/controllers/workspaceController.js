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

// Workspace activity timeline feed
const getWorkspaceActivity = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID required" });
    }

    const AuditLog = require("../models/AuditLog");
    const logs = await AuditLog.find({ workspaceId })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    const activities = logs.map(log => {
      let title = log.details || `Activity on ${log.entity || "System"}`;
      if (log.action === "CREATE_RESIDENT") {
        title = `Resident Admitted: ${log.newValue?.name || "New Resident"}`;
      } else if (log.action === "CREATE_PAYMENT") {
        title = `Payment Collected: ₹${log.newValue?.amount || 0}`;
      } else if (log.action === "CREATE_ROOM") {
        title = `Room Created: Room ${log.newValue?.roomNumber || ""}`;
      } else if (log.action === "CREATE_HOSTEL") {
        title = `Hostel Created: ${log.newValue?.name || ""}`;
      } else if (log.action === "UPDATE_SUBSCRIPTION") {
        title = `Subscription Updated`;
      } else if (log.action === "CREATE_EXPENSE") {
        title = `Expense Recorded: ₹${log.newValue?.amount || 0}`;
      }

      return {
        id: log._id,
        title,
        timestamp: log.timestamp || log.createdAt,
        type: log.actionType || "INFO",
        entity: log.entity,
      };
    });

    res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("getWorkspaceActivity error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Workspace universal search
const workspaceUniversalSearch = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    const query = req.query.q || "";

    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID required" });
    }

    if (!query) {
      return res.status(200).json({
        success: true,
        results: { residents: [], rooms: [], payments: [], staff: [], hostels: [] }
      });
    }

    const Staff = require("../models/Staff");
    const regex = new RegExp(query, "i");

    // Resolve workspace hostels
    const hostels = await Hostel.find({ workspaceId }).select("_id hostelName name city").lean();
    const hostelIds = hostels.map(h => h._id);

    const [residents, rooms, payments, staff] = await Promise.all([
      Resident.find({ hostelId: { $in: hostelIds }, name: regex }).limit(10).lean(),
      Room.find({ hostelId: { $in: hostelIds }, roomNumber: regex }).limit(10).lean(),
      Payment.find({ hostelId: { $in: hostelIds } })
        .populate("residentId")
        .limit(10)
        .lean(),
      Staff.find({ hostelId: { $in: hostelIds }, name: regex }).limit(10).lean(),
    ]);

    const filteredPayments = payments.filter(p => 
      p.month?.toLowerCase().includes(query.toLowerCase()) || 
      p.residentId?.name?.toLowerCase().includes(query.toLowerCase())
    );

    res.status(200).json({
      success: true,
      results: {
        residents: residents.map(r => ({ id: r._id, name: r.name, phone: r.phone, status: r.status })),
        rooms: rooms.map(rm => ({ id: rm._id, roomNumber: rm.roomNumber, roomType: rm.roomType })),
        payments: filteredPayments.map(p => ({
          id: p._id,
          residentName: p.residentId?.name || "Resident",
          month: p.month,
          amount: p.totalRent || p.amount,
          status: p.status
        })),
        staff: staff.map(s => ({ id: s._id, name: s.name, role: s.role || "Staff" })),
        hostels: hostels.filter(h => (h.hostelName || h.name)?.match(regex)).map(h => ({
          id: h._id,
          name: h.hostelName || h.name,
          city: h.city
        }))
      }
    });

  } catch (error) {
    console.error("workspaceUniversalSearch error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Workspace AI suggestions and insights
const getWorkspaceInsights = async (req, res) => {
  try {
    const { workspaceId } = req.context;
    if (!workspaceId) {
      return res.status(400).json({ success: false, message: "Workspace ID required" });
    }

    const FeatureRegistry = require("../services/FeatureRegistry");

    // Load hostels
    const hostels = await Hostel.find({ workspaceId }).lean();
    const hostelIds = hostels.map(h => h._id);

    const insights = [];

    // 1. Occupancy checks
    for (const hostel of hostels) {
      const totalRooms = await Room.countDocuments({ hostelId: hostel._id });
      const occupiedRooms = await Room.countDocuments({ hostelId: hostel._id, occupiedBeds: { $gt: 0 } });
      const rate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
      if (rate < 60 && totalRooms > 0) {
        insights.push({
          type: "warning",
          title: "Low Occupancy warning",
          description: `Occupancy in ${hostel.hostelName || hostel.name} is below 60% (${rate.toFixed(0)}%).`
        });
      }
    }

    // 2. Pending payment checks
    const pendingPayments = await Payment.find({ hostelId: { $in: hostelIds }, status: "partial" }).lean();
    const totalPendingRent = pendingPayments.reduce((sum, p) => sum + (p.balance || 0), 0);
    if (totalPendingRent > 5000) {
      insights.push({
        type: "warning",
        title: "High Pending Rent",
        description: `Pending rent has reached ₹${totalPendingRent.toLocaleString()} across your workspace.`
      });
    }

    // 3. Top performing hostel
    if (hostels.length > 1) {
      let topHostel = null;
      let topRate = -1;
      let lowestHostel = null;
      let lowestRate = 101;

      for (const h of hostels) {
        const total = await Room.countDocuments({ hostelId: h._id });
        const occupied = await Room.countDocuments({ hostelId: h._id, occupiedBeds: { $gt: 0 } });
        const rate = total > 0 ? (occupied / total) * 100 : 0;

        if (rate > topRate) {
          topRate = rate;
          topHostel = h;
        }
        if (rate < lowestRate) {
          lowestRate = rate;
          lowestHostel = h;
        }
      }

      if (topHostel && topRate > 0) {
        insights.push({
          type: "success",
          title: "Top Performing Hostel",
          description: `${topHostel.hostelName || topHostel.name} has the highest occupancy of ${topRate.toFixed(0)}%.`
        });
      }
      if (lowestHostel && lowestRate < 60 && lowestHostel._id !== topHostel?._id) {
        insights.push({
          type: "info",
          title: "Lowest Performing Hostel",
          description: `${lowestHostel.hostelName || lowestHostel.name} has the lowest occupancy of ${lowestRate.toFixed(0)}%.`
        });
      }
    }

    // 4. Storage warn
    const storage = await StorageUsage.findOne({ workspaceId }).lean();
    if (storage) {
      const limit = await FeatureRegistry.limit(workspaceId, "storage");
      if (limit && limit !== 999999) {
        const usagePct = (storage.usedBytes / limit) * 100;
        if (usagePct >= 80) {
          insights.push({
            type: "warning",
            title: "Storage Capacity Warning",
            description: `Workspace storage is at ${usagePct.toFixed(0)}% capacity. Clean up or upgrade.`
          });
        }
      }
    }

    // Fallback if no insights
    if (insights.length === 0) {
      insights.push({
        type: "success",
        title: "Workspace Healthy",
        description: "All hostels are performing optimally. Rent collection is on track."
      });
    }

    res.status(200).json({ success: true, insights });
  } catch (error) {
    console.error("getWorkspaceInsights error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getActiveContext,
  updateActiveContext,
  getWorkspaceOverview,
  listWorkspaceHostels,
  createWorkspaceHostel,
  getWorkspaceActivity,
  workspaceUniversalSearch,
  getWorkspaceInsights,
};
