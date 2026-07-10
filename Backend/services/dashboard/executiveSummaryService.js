const HostelRequest = require("../../models/HostelRequest");
const Hostel = require("../../models/Hostel");
const Subscription = require("../../models/Subscription");
const Owner = require("../../models/Owner");
const Payment = require("../../models/Payment");

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const formatINR = (n) => {
  const num = safeNumber(n, 0);
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(num);
  } catch {
    return `₹${Math.round(num)}`;
  }
};

async function getExecutiveSummary() {
  // Hostels
  const [
    activeHostels,
    trialHostels,
    expiredHostels,
    pendingRenewals,
    activeOwners,
  ] = await Promise.all([
    Hostel.countDocuments({ pendingActivation: false }),
    Hostel.countDocuments({ pendingActivation: false, subscriptionStatus: "trial" }),
    Hostel.countDocuments({ pendingActivation: false, subscriptionStatus: "expired" }),

    // Pending renewals: subscriptions ending in next 30 days.
    Subscription.countDocuments({
      subscriptionEndDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      subscriptionStatus: { $in: ["active", "expired"] },
    }),

    Owner.countDocuments({ status: "active" }),
  ]);

  // Revenue: approximate MRR from paid amounts for last 30d; ARR = MRR*12
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [monthlyAgg, prevAgg] = await Promise.all([
    Payment.aggregate([
      { $match: { createdAt: { $gte: since30 } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
    Payment.aggregate([
      { $match: { createdAt: { $gte: since60, $lt: since30 } } } ,
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
  ]);

  const monthlyRevenue = safeNumber(monthlyAgg?.[0]?.total, 0);
  const prevRevenue = safeNumber(prevAgg?.[0]?.total, 0);

  const growthPct = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const mrr = monthlyRevenue;
  const arr = monthlyRevenue * 12;

  // Platform health score: simple weighted score based on subscription status.
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
  const healthScore = Math.round(
    (safeNumber(t.activeCount, 0) * 1.0 + safeNumber(t.trialCount, 0) * 0.6 + safeNumber(t.expiredCount, 0) * 0.2) /
      denom /
      1.0 * 100
  );

  // Database health from system health service-like metrics; keep lightweight.
  // If mongodb stats fails, we still return a score.
  let databasePercent = 0;
  try {
    const mongoose = require("mongoose");
    const stats = await mongoose.connection.db.stats();
    // Convert storageSize bytes to a heuristic percent of 1GB.
    const storageBytes = safeNumber(stats?.storageSize, 0);
    const gb = 1024 * 1024 * 1024;
    databasePercent = Math.min(100, Math.round((storageBytes / gb) * 10));
  } catch {
    databasePercent = 0;
  }

  const summary = {
    summary: "",
    raw: {
      activeHostels,
      trialHostels,
      expiredHostels,
      pendingRenewals,
      activeOwners,
      mrr: formatINR(mrr),
      arr: formatINR(arr),
      revenueGrowth: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
      healthScore: `${healthScore}/100`,
      databaseUtilizationPercent: databasePercent,
    },
  };

  // Keep summary string deterministic but derived from real values (no hardcoded placeholders).
  summary.summary = `Platform executive summary: ${activeHostels} active hostels, ${trialHostels} trial hostels, ${expiredHostels} expired hostels. Pending renewals next cycle: ${pendingRenewals}. Monthly revenue (MRR) is ${formatINR(mrr)} (${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}% vs previous window) and ARR is ${formatINR(arr)}. Platform health score is ${healthScore}/100 with database utilization at ${databasePercent}%.`;

  return summary;
}

module.exports = { getExecutiveSummary };

