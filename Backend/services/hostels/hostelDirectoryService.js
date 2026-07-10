const Hostel = require("../../models/Hostel");
const Owner = require("../../models/Owner");
const Subscription = require("../../models/Subscription");
const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const Resident = require("../../models/Resident");
const HostelRequest = require("../../models/HostelRequest");

const toNumberOr = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const normalizePlanType = (plan) => {
  if (!plan) return null;
  const p = String(plan).toLowerCase();
  if (p === "pro" || p === "monthly" || p === "yearly") return "Pro";
  if (p === "trial") return "Trial";
  if (p === "basic") return "Basic";
  return plan;
};

/**
 * Directory list for superadmin.
 * Supports filtering by status, subscription, plan, geography, etc.
 */
async function getHostelDirectory({
  page = 1,
  pageSize = 25,
  search = "",
  sortField = "createdAt",
  sortOrder = "desc",
  filters = {},
} = {}) {
  page = Math.max(1, toNumberOr(page, 1));
  pageSize = Math.max(1, Math.min(100, toNumberOr(pageSize, 25)));

  const normalizedSearch = String(search || "").trim();
  const skip = (page - 1) * pageSize;

  const query = { pendingActivation: false };

  // Filters
  if (filters.status) {
    // status maps to Hostel.subscriptionStatus/approvalStatus loosely
    query.subscriptionStatus = String(filters.status);
  }

  if (filters.city) query.city = String(filters.city);
  if (filters.district) query.district = String(filters.district);
  if (filters.state) query.state = String(filters.state);

  // subscription + plan are stored on Hostel/Subscription
  if (filters.subscription) {
    query.subscriptionStatus = String(filters.subscription);
  }

  // Plan type is on Hostel.planType or Subscription.planType
  // We'll filter via Hostel.planType for simplicity.
  if (filters.plan) {
    const p = normalizePlanType(filters.plan);
    if (p && p !== "Trial") query.planType = p;
  }

  // For advanced filter of healthScore/occupancy/residents/lastLogin/createdDate:
  // those fields are not explicit in schema; we compute derived fields per-row.

  // Search against basic fields
  if (normalizedSearch) {
    query.$or = [
      { hostelName: { $regex: normalizedSearch, $options: "i" } },
      { ownerName: { $regex: normalizedSearch, $options: "i" } },
      { phone: { $regex: normalizedSearch, $options: "i" } },
      { city: { $regex: normalizedSearch, $options: "i" } },
      { district: { $regex: normalizedSearch, $options: "i" } },
      { state: { $regex: normalizedSearch, $options: "i" } },
      { uniqueCode: { $regex: normalizedSearch, $options: "i" } },
    ];
  }

  const sort = {};
  sort[sortField] = sortOrder === "asc" ? 1 : -1;

  const [total, hostels] = await Promise.all([
    Hostel.countDocuments(query),
    Hostel.find(query)
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
  ]);

  // Derived per-row fields expected by HostelsList UI
  const rows = [];
  for (const hostel of hostels || []) {
    const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
    const subscription = await Subscription.findOne({ hostelId: hostel._id }).lean();
    const rooms = await Room.find({ hostelId: hostel._id }).lean();
    const beds = await Bed.find({ hostelId: hostel._id }).lean();
    const activeResidents = await Resident.countDocuments({ hostelId: hostel._id, status: "active" });

    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach((r) => {
      totalBeds += toNumberOr(r.totalBeds, 0);
      occupiedBeds += toNumberOr(r.occupiedBeds, 0);
    });

    // Fallback to Bed records if room allocation is missing
    if ((!totalBeds || !occupiedBeds) && beds?.length) {
      totalBeds = beds.length;
      occupiedBeds = beds.filter((b) => String(b.status).toLowerCase() === "occupied").length;
    }

    const vacantBeds = Math.max(0, totalBeds - occupiedBeds);
    const occupancyPct = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const hostelId = hostel._id;
    rows.push({
      id: hostelId,
      logo: hostel.hostelName ? hostel.hostelName.slice(0, 1).toUpperCase() : "H",
      hostelId,
      name: hostel.hostelName,
      owner: owner?.ownerName || hostel.ownerName,
      ownerId: owner?._id,
      phone: owner?.phone || hostel.phone,
      hostelCode: hostel.uniqueCode,
      plan: subscription?.planType || hostel.planType,
      status: hostel.subscriptionStatus || subscription?.subscriptionStatus,
      residents: activeResidents,
      occupancy: `${occupancyPct}%`,
      revenue: "", // UI expects revenue but derived revenue integration is Phase 4.1 dashboard; not enough info here.
      healthScore: 0, // healthScore not present in schema for directory table.
      lastLogin: "", // last login is derived in other hooks; not required in this phase.
      createdDate: hostel.createdAt ? hostel.createdAt.toISOString().slice(0, 10) : "",
    });
  }

  return {
    success: true,
    data: rows,
    pagination: { total, page, pageSize },
    meta: {
      filters,
      sorting: { sortField, sortOrder },
    },
  };
}

module.exports = { getHostelDirectory };

