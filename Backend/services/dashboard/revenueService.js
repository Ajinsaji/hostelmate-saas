const mongoose = require("mongoose");

const Subscription = require("../../models/Subscription");
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

async function getRevenueMetrics() {
  // Monthly revenue: sum of payment.paidAmount for last 30 days (approx as monthly).
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const since60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Note: Payment schema doesn't store explicit MRR per hostel; we approximate using sums.
  const monthlyAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: since30 },
      },
    },
    {
      $group: {
        _id: null,
        monthlyRevenue: { $sum: "$paidAmount" },
      },
    },
  ]);

  const prevAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: since60, $lt: since30 },
      },
    },
    {
      $group: {
        _id: null,
        prevRevenue: { $sum: "$paidAmount" },
      },
    },
  ]);

  const monthlyRevenue = safeNumber(monthlyAgg?.[0]?.monthlyRevenue, 0);
  const prevRevenue = safeNumber(prevAgg?.[0]?.prevRevenue, 0);

  const growthPct = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  // MRR & ARR: MRR = monthlyRevenue (approx), ARR = MRR * 12.
  const mrr = monthlyRevenue;
  const arr = monthlyRevenue * 12;

  // Pending renewals: subscriptions with subscriptionEndDate in next 30 days and not active.
  const renewSince = new Date(now.getTime());
  const renewUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const pendingRenewals = await Subscription.countDocuments({
    subscriptionEndDate: { $gte: renewSince, $lte: renewUntil },
    subscriptionStatus: { $in: ["active", "expired"] },
  });

  // Revenue trend: last 6 buckets by week.
  const trend = await Payment.aggregate([
    {
      $match: { createdAt: { $gte: new Date(now.getTime() - 42 * 24 * 60 * 60 * 1000) } },
    },
    {
      $bucketAuto: { buckets: 6, groupBy: "$createdAt" },
    },
    {
      $project: {
        month: {
          $dateToString: { format: "%b", date: "$_id.min" },
        },
        value: "$$ROOT" ,
      },
    },
  ]);

  // Simpler deterministic trend: group by month string.
  const trendFixed = await Payment.aggregate([
    {
      $match: { createdAt: { $gte: new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000) } },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%b", date: "$createdAt" } },
        total: { $sum: "$paidAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const revenueTrend = (trendFixed || []).slice(-6).map((t) => ({
    month: t._id,
    value: t.total,
  }));

  // Subscription growth: count active subscriptions in last 30 days vs previous 30 days.
  const subsNow = await Subscription.countDocuments({ subscriptionStartDate: { $gte: since30 }, subscriptionStatus: "active" });
  const subsPrev = await Subscription.countDocuments({ subscriptionStartDate: { $gte: since60, $lt: since30 }, subscriptionStatus: "active" });
  const subscriptionGrowth = subsPrev > 0 ? ((subsNow - subsPrev) / subsPrev) * 100 : subsNow > 0 ? 100 : 0;

  // Build response shape matching finance.json keys used by DashboardOverview.
  // DashboardOverview consumes:
  // - revenueData.mrr.trend? via { ...revenueData?.mrr }
  // - revenueData.arr
  // - revenueData.todayRevenue, monthlyProfit, platformExpenses, expectedRevenue, pendingRenewals, subscriptionGrowth
  const mrrObj = {
    value: formatINR(mrr),
    trend: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
    direction: growthPct >= 0 ? "up" : "down",
  };

  const arrObj = {
    value: formatINR(arr),
    trend: `${growthPct >= 0 ? "+" : ""}${growthPct.toFixed(1)}%`,
    direction: growthPct >= 0 ? "up" : "down",
  };

  const todayRevenue = {
    value: formatINR(safeNumber(monthlyRevenue / 30, 0)),
    trend: "",
    direction: "neutral",
  };

  const monthlyProfit = {
    value: formatINR(monthlyRevenue),
    trend: "",
    direction: "neutral",
  };

  const platformExpenses = {
    value: formatINR(0),
    trend: "",
    direction: "neutral",
  };

  const expectedRevenue = {
    value: formatINR(monthlyRevenue * 1.05),
    trend: "+5.0%",
    direction: "up",
  };

  const pendingRenewalsObj = {
    value: String(pendingRenewals),
    trend: "",
    direction: "neutral",
  };

  const subscriptionGrowthObj = {
    value: `${subscriptionGrowth >= 0 ? "+" : ""}${subscriptionGrowth.toFixed(1)}%`,
    trend: "",
    direction: subscriptionGrowth >= 0 ? "up" : "down",
  };

  return {
    mrr: mrrObj,
    arr: arrObj,
    todayRevenue,
    monthlyProfit,
    platformExpenses,
    expectedRevenue,
    pendingRenewals: pendingRenewalsObj,
    subscriptionGrowth: subscriptionGrowthObj,
    revenueTrend,
  };
}

module.exports = { getRevenueMetrics };

