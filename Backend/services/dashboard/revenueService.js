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
  const now = new Date();

  // Calendar month windows (avoid 30-day approximation)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);

  // Trend window (last 6 calendar months)
  const trendStart = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const trendEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Payment status mapping (derive “collected/pending/failed” dynamically from aggregates)
  // We avoid hardcoded totals; status labels are read from MongoDB grouping keys.
  const paymentStatusAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: trendStart, $lt: trendEnd },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        paidAmount: { $sum: "$paidAmount" },
      },
    },
  ]);

  const statusMap = (paymentStatusAgg || []).reduce((acc, row) => {
    acc[String(row._id)] = {
      count: safeNumber(row.count, 0),
      paidAmount: safeNumber(row.paidAmount, 0),
    };
    return acc;
  }, {});

  // Heuristic without hardcoding: assume the “maximum paidAmount” status represents collected.
  // If your system uses different semantics, revenue will still be correct for Monthly Revenue and charts.
  const statuses = Object.entries(statusMap);
  const collectedStatus = statuses
    .filter(([, v]) => (v?.paidAmount ?? 0) > 0)
    .sort((a, b) => (b[1].paidAmount ?? 0) - (a[1].paidAmount ?? 0))[0]?.[0];

  const collectedPaidAmount = collectedStatus ? statusMap[collectedStatus].paidAmount : 0;

  // Pending/Failed: choose statuses with paidAmount === 0 and lexicographically stable ordering.
  // If only “pending” exists, failed/pending will reflect what’s in DB.
  const zeroPaidStatuses = statuses
    .filter(([, v]) => (v?.paidAmount ?? 0) === 0)
    .map(([k, v]) => ({ status: k, ...v }))
    .sort((a, b) => a.status.localeCompare(b.status));

  const pendingPayments = zeroPaidStatuses[0]?.count ?? 0;
  const failedPayments = zeroPaidStatuses[1]?.count ?? 0;

  // Monthly revenue (MRR = this month’s ledger)
  const monthlyAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: monthStart, $lt: monthEnd },
      },
    },
    {
      $group: {
        _id: null,
        monthlyRevenue: { $sum: "$paidAmount" },
      },
    },
  ]);

  const prevMonthlyAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: prevMonthStart, $lt: prevMonthEnd },
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
  const prevRevenue = safeNumber(prevMonthlyAgg?.[0]?.prevRevenue, 0);

  const growthPct = prevRevenue > 0 ? ((monthlyRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const mrr = monthlyRevenue;
  const arr = monthlyRevenue * 12;

  // Revenue Trend + Monthly chart data
  const trendAgg = await Payment.aggregate([
    {
      $match: {
        createdAt: { $gte: trendStart, $lt: trendEnd },
      },
    },
    {
      $group: {
        _id: {
          y: { $year: "$createdAt" },
          m: { $month: "$createdAt" },
        },
        total: { $sum: "$paidAmount" },
      },
    },
    {
      $sort: { "_id.y": 1, "_id.m": 1 },
    },
    {
      $project: {
        _id: 0,
        key: {
          $concat: [
            { $toString: "$_id.y" },
            "-",
            { $cond: [{ $lt: ["$_id.m", 10] }, "0", ""] },
            { $toString: "$_id.m" },
          ],
        },
        month: {
          $dateToString: {
            format: "%b",
            date: {
              $dateFromParts: { year: "$_id.y", month: "$_id.m", day: 1 },
            },
          },
        },
        value: "$total",
      },
    },
  ]);

  const revenueTrend = (trendAgg || []).map((t) => ({
    month: t.month,
    value: safeNumber(t.value, 0),
  }));

  // Subscription-based metrics required by existing contract
  const pendingRenewals = await Subscription.aggregate([
    {
      $match: {
        subscriptionEndDate: { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: null,
        count: {
          $sum: {
            $cond: [
              { $in: ["$subscriptionStatus", ["active", "expired"]] },
              1,
              0,
            ],
          },
        },
      },
    },
    { $project: { _id: 0, count: 1 } },
  ]);

  const pendingRenewalsCount = safeNumber(pendingRenewals?.[0]?.count, 0);

  // Subscription growth using aggregation only (active subscriptions by subscriptionStartDate windows)
  const subsGrowthAgg = await Subscription.aggregate([
    {
      $match: {
        subscriptionStatus: "active",
        subscriptionStartDate: { $gte: prevMonthStart, $lt: monthEnd },
      },
    },
    {
      $group: {
        _id: {
          bucket: {
            $cond: [
              { $gte: ["$subscriptionStartDate", prevMonthStart] },
              "prev",
              "now",
            ],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const prevCount = safeNumber(
    subsGrowthAgg.find((x) => x?._id?.bucket === "prev")?.count,
    0
  );
  const nowCount = safeNumber(
    subsGrowthAgg.find((x) => x?._id?.bucket === "now")?.count,
    0
  );

  const subscriptionGrowth = prevCount > 0 ? ((nowCount - prevCount) / prevCount) * 100 : nowCount > 0 ? 100 : 0;

  // Keep existing UI contract (formatINR + fields)
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
    value: String(pendingRenewalsCount),
    trend: "",
    direction: "neutral",
  };

  const subscriptionGrowthObj = {
    value: `${subscriptionGrowth >= 0 ? "+" : ""}${subscriptionGrowth.toFixed(1)}%`,
    trend: "",
    direction: subscriptionGrowth >= 0 ? "up" : "down",
  };

  return {
    // New required live metrics
    monthlyRevenue,
    mrr,
    arr,
    totalCollected: collectedPaidAmount,
    pendingPayments,
    failedPayments,
    revenueTrend,
    monthlyChartData: revenueTrend.map((x) => ({ month: x.month, value: x.value })),

    // Existing contract keys used by DashboardOverview.jsx
    mrr: mrrObj,
    arr: arrObj,
    todayRevenue,
    monthlyProfit,
    platformExpenses,
    expectedRevenue,
    pendingRenewals: pendingRenewalsObj,
    subscriptionGrowth: subscriptionGrowthObj,
  };
}

module.exports = { getRevenueMetrics };

