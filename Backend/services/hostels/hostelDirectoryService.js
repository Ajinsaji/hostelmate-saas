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
 * Supports filtering by status, subscription, plan, geography, multi-field search, etc.
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

  const queryConditions = [];

  // Default to non-pending activation unless explicitly filtering for pending/activation_pending status
  const requestedStatus = String(filters.status || filters.subscription || "").trim().toLowerCase();
  if (requestedStatus === "pending" || requestedStatus === "activation_pending") {
    queryConditions.push({
      $or: [
        { pendingActivation: true },
        { subscriptionStatus: "pending" },
        { approvalStatus: "activation_pending" }
      ]
    });
  } else if (requestedStatus && requestedStatus !== "all" && requestedStatus !== "all statuses") {
    queryConditions.push({ pendingActivation: false });
    if (requestedStatus === "active") {
      queryConditions.push({
        $or: [
          { subscriptionStatus: "active" },
          { approvalStatus: "approved" },
          { subscriptionStatus: { $exists: false } }
        ]
      });
    } else if (requestedStatus === "trial") {
      queryConditions.push({
        $or: [
          { subscriptionStatus: "trial" },
          { isTrial: true }
        ]
      });
    } else if (requestedStatus === "suspended") {
      queryConditions.push({ subscriptionStatus: "suspended" });
    } else if (requestedStatus === "expired") {
      queryConditions.push({ subscriptionStatus: "expired" });
    } else {
      queryConditions.push({ subscriptionStatus: requestedStatus });
    }
  } else {
    queryConditions.push({ pendingActivation: false });
  }

  // Location filters
  if (filters.city) queryConditions.push({ city: { $regex: String(filters.city), $options: "i" } });
  if (filters.district) queryConditions.push({ district: { $regex: String(filters.district), $options: "i" } });
  if (filters.state) queryConditions.push({ state: { $regex: String(filters.state), $options: "i" } });

  // Plan filter
  const requestedPlan = String(filters.plan || "").trim();
  if (requestedPlan && requestedPlan.toLowerCase() !== "all" && requestedPlan.toLowerCase() !== "all plans") {
    const normPlan = normalizePlanType(requestedPlan);
    if (normPlan === "Trial") {
      queryConditions.push({
        $or: [
          { planType: { $regex: "^trial$", $options: "i" } },
          { isTrial: true },
          { subscriptionStatus: "trial" }
        ]
      });
    } else if (normPlan) {
      queryConditions.push({ planType: { $regex: `^${normPlan}$`, $options: "i" } });
    }
  }

  // Multi-field search
  if (normalizedSearch) {
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapeRegex(normalizedSearch), "i");

    // Also find matching Owner IDs if search term matches owner details
    const matchingOwners = await Owner.find({
      $or: [
        { ownerName: searchRegex },
        { phone: searchRegex },
        { email: searchRegex }
      ]
    }).select("hostelId").lean();

    const matchingHostelIdsFromOwners = (matchingOwners || [])
      .map(o => o.hostelId)
      .filter(Boolean);

    const searchConditions = [
      { hostelName: searchRegex },
      { ownerName: searchRegex },
      { phone: searchRegex },
      { email: searchRegex },
      { city: searchRegex },
      { district: searchRegex },
      { state: searchRegex },
      { pincode: searchRegex },
      { uniqueCode: searchRegex },
      { slug: searchRegex }
    ];

    if (matchingHostelIdsFromOwners.length > 0) {
      searchConditions.push({ _id: { $in: matchingHostelIdsFromOwners } });
    }

    queryConditions.push({ $or: searchConditions });
  }

  const query = queryConditions.length > 1 ? { $and: queryConditions } : (queryConditions[0] || {});

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
      name: hostel.hostelName || "Not provided",
      owner: owner?.ownerName || hostel.ownerName || "Not provided",
      ownerId: owner?._id,
      phone: owner?.phone || hostel.phone || "Not provided",
      email: owner?.email || hostel.email || "Not provided",
      ownerPhoto: owner?.profileImage || owner?.photo || hostel.ownerPhoto || "",
      city: hostel.city || "Not provided",
      state: hostel.state || "Not provided",
      district: hostel.district || "Not provided",
      pincode: hostel.pincode || "Not provided",
      hostelCode: hostel.uniqueCode || "",
      plan: subscription?.planType || hostel.planType || "Basic",
      status: hostel.subscriptionStatus || subscription?.subscriptionStatus || "active",
      residents: activeResidents,
      occupancy: `${occupancyPct}%`,
      revenue: "₹0",
      healthScore: 85,
      lastLogin: owner?.updatedAt ? new Date(owner.updatedAt).toISOString().slice(0, 10) : "",
      createdDate: hostel.createdAt ? new Date(hostel.createdAt).toISOString().slice(0, 10) : "",
    });
  }

  return {
    success: true,
    data: rows,
    hostels: rows,
    pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    meta: {
      filters,
      sorting: { sortField, sortOrder },
    },
  };
}

module.exports = { getHostelDirectory };

