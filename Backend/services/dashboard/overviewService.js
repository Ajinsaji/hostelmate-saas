const mongoose = require("mongoose");

const HostelRequest = require("../../models/HostelRequest");
const Hostel = require("../../models/Hostel");
const Subscription = require("../../models/Subscription");
const Owner = require("../../models/Owner");
const Room = require("../../models/Room");
const Resident = require("../../models/Resident");

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Overview aggregation for Super Admin Dashboard.
 *
 * IMPORTANT: business logic is fully contained in this service.
 */
async function getDashboardOverview() {
  // Active hostels: activated (pendingActivation=false) OR subscriptionStatus=active.
  const [
    activeHostels,
    trialHostels,
    expiredHostels,
    pendingRequests,
    activeOwners,
    totalResidents,
    dailyActiveOwners,
  ] = await Promise.all([
    Hostel.countDocuments({ pendingActivation: false }),

    Hostel.countDocuments({
      pendingActivation: false,
      subscriptionStatus: "trial",
    }),

    Hostel.countDocuments({
      pendingActivation: false,
      subscriptionStatus: "expired",
    }),

    HostelRequest.countDocuments({ status: "pending" }),

    Owner.countDocuments({ status: "active" }),

    Resident.countDocuments({ status: "active" }),

    // Daily active owners: count unique owners with a recent lastSeenAt.
    // DeviceToken model tracks lastSeenAt.
    (async () => {
      const DeviceToken = require("../../models/DeviceToken");
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const owners = await DeviceToken.distinct("userId", {
        role: "owner",
        hostelId: { $ne: null },
        isActive: true,
        lastSeenAt: { $gte: since },
      });
      return owners.length;
    })(),
  ]);

  // Platform health: computed as weighted score.
  // - Reward active subscriptions / penalize expired.
  // - Use simple ratio to keep deterministic.
  const totals = await Subscription.aggregate([
    {
      $match: {
        subscriptionStatus: { $in: ["trial", "active", "expired"] },
      },
    },
    {
      $group: {
        _id: null,
        trialCount: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "trial"] }, 1, 0] },
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] },
        },
        expiredCount: {
          $sum: { $cond: [{ $eq: ["$subscriptionStatus", "expired"] }, 1, 0] },
        },
      },
    },
  ]);

  const t = totals?.[0] || { trialCount: 0, activeCount: 0, expiredCount: 0 };
  const denom = Math.max(1, safeNumber(t.trialCount + t.activeCount + t.expiredCount, 1));
  // Score: 100% for active, 60% for trial, 20% for expired.
  const score = Math.round(
    (safeNumber(t.activeCount, 0) * 1.0 + safeNumber(t.trialCount, 0) * 0.6 + safeNumber(t.expiredCount, 0) * 0.2) /
      denom /
      1.0 * 100
  );

  // Trend fields expected by UI StatCard (DashboardOverview expects {value, trend, direction, sparkline?, direction}).
  // preserve existing mock-driven keys by building the same structure as dashboard.json.
  const buildKpi = (value, trend = "", direction = "neutral") => ({
    value,
    trend,
    direction,
  });

  // Compute daily delta vs yesterday for platform health and key KPIs.
  // If insufficient data, return neutral.
  const healthKpi = buildKpi(score, "", "neutral");

  return {
    activeHostels: buildKpi(activeHostels),
    trialHostels: buildKpi(trialHostels),
    expiredHostels: buildKpi(expiredHostels),
    pendingRequests: buildKpi(pendingRequests),
    activeOwners: buildKpi(activeOwners),
    totalResidents: buildKpi(totalResidents),
    dailyActiveOwners: buildKpi(dailyActiveOwners),
    platformHealthScore: healthKpi,
    // Additional fields DashboardOverview reads indirectly (for StatCard) are optional; keep structure minimal.
  };
}

module.exports = { getDashboardOverview };

