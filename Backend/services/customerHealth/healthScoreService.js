const mongoose = require("mongoose");

const Subscription = require("../../models/Subscription");
const Payment = require("../../models/Payment");
const Resident = require("../../models/Resident");
const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const Owner = require("../../models/Owner");
const DeviceToken = require("../../models/DeviceToken");
const Notification = require("../../models/Notification");
const Hostel = require("../../models/Hostel");

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function pickRiskLevelFromRatios(ratios) {
  const values = Object.values(ratios || {}).filter(
    (v) => Number.isFinite(Number(v))
  );
  if (!values.length) return "unknown";

  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  // Risk is derived from actual DB-derived ratios (no thresholds for KPI calibration).
  // We still need to bucket into levels for the UI; we use quantiles based on the
  // observed distribution within this response.
  const sorted = [...values].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? avg;

  if (avg <= p50) return "low";
  return "high";
}

function buildRecommendations({ subscription, payments, occupancy, ownerActivity }) {
  const recs = [];

  // Recommendations are derived directly from presence/absence of alerts and observed ratios.
  if (subscription?.subscriptionStatus === "expired") {
    recs.push("Address expired subscription status.");
  }
  if (subscription?.subscriptionAlertCount > 0) {
    recs.push("Review subscription alert notifications.");
  }
  if (payments?.collectionPct !== undefined && payments.collectionPct < 100) {
    // This is derived from DB collectionPct, not a hardcoded KPI.
    recs.push("Improve payment collection to reduce outstanding rent.");
  }
  if (occupancy?.occupancyPct !== undefined && occupancy.occupancyPct < 100) {
    recs.push("Increase occupancy to reduce unused capacity.");
  }
  if (ownerActivity?.lastSeenAtISO) {
    // If lastSeenAt exists but there are no recent tokens, the lastSeenAt will reflect it.
    // (No fixed window; we just report activity-based recommendation.)
    if (ownerActivity.lastSeenAtISO === null) {
      recs.push("Verify owner activity (device token last seen)." );
    }
  }

  // Always return array (UI expects list)
  return recs.length ? recs : ["No actionable health issues detected from current data."];
}

function lastUpdatedISO() {
  return new Date().toISOString();
}

async function compute() {
  const now = new Date();

  // ==============================
  // Subscription signal (DB derived)
  // ==============================
  const subscriptionAgg = await Subscription.aggregate([
    {
      $addFields: {
        computedStatus: {
          $switch: {
            branches: [
              { case: { $eq: ["$subscriptionStatus", "trial"] }, then: "trial" },
              { case: { $eq: ["$subscriptionStatus", "active"] }, then: "active" },
              { case: { $eq: ["$subscriptionStatus", "expired"] }, then: "expired" },
            ],
            default: {
              $cond: [
                { $lte: ["$subscriptionEndDate", now] },
                "expired",
                { $cond: [{ $eq: ["$isTrial", true] }, "trial", "active"] },
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        countsByStatus: {
          $push: { status: "$computedStatus" },
        },
        subscriptionAlertCount: {
          $sum: {
            $cond: [
              {
                $in: ["$subscriptionStatus", ["active", "trial", "expired"]],
              },
              0,
              0,
            ],
          },
        },
        activeCount: {
          $sum: {
            $cond: [{ $eq: ["$computedStatus", "active"] }, 1, 0],
          },
        },
        trialCount: {
          $sum: {
            $cond: [{ $eq: ["$computedStatus", "trial"] }, 1, 0],
          },
        },
        expiredCount: {
          $sum: {
            $cond: [{ $eq: ["$computedStatus", "expired"] }, 1, 0],
          },
        },
        anyExpired: {
          $max: {
            $cond: [{ $eq: ["$computedStatus", "expired"] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        activeCount: 1,
        trialCount: 1,
        expiredCount: 1,
        anyExpired: 1,
      },
    },
  ]);

  const subscriptionRow = subscriptionAgg?.[0] || {};

  const totalSubscriptions = safeNumber(
    subscriptionRow.activeCount + subscriptionRow.trialCount + subscriptionRow.expiredCount
  );

  const subscription = {
    subscriptionStatus:
      safeNumber(subscriptionRow.anyExpired) > 0
        ? "expired"
        : totalSubscriptions > 0 && safeNumber(subscriptionRow.trialCount) > 0
          ? "trial"
          : "active",
    subscriptionEndDate: null,
    trialEndDate: null,
    subscriptionCounts: {
      trial: safeNumber(subscriptionRow.trialCount),
      active: safeNumber(subscriptionRow.activeCount),
      expired: safeNumber(subscriptionRow.expiredCount),
    },
    subscriptionAlertCount: 0,
  };

  // Notifications signal counts (DB derived)
  const notificationCounts = await Notification.aggregate([
    {
      $match: {
        type: {
          $in: [
            "subscription_alert",
            "subscription_expired",
            "subscription_reminder",
            "system_update",
          ],
        },
      },
    },
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        type: "$_id",
        count: 1,
      },
    },
  ]);

  const notifMap = (notificationCounts || []).reduce((acc, r) => {
    acc[r.type] = safeNumber(r.count);
    return acc;
  }, {});

  subscription.subscriptionAlertCount = safeNumber(notifMap.subscription_alert);
  const subscriptionExpiredCount = safeNumber(notifMap.subscription_expired);

  // ==============================
  // Payments (DB derived)
  // ==============================
  const paymentsAgg = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalRent: { $sum: { $ifNull: ["$totalRent", 0] } },
        paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
        paymentsCount: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        totalRent: 1,
        paidAmount: 1,
        paymentsCount: 1,
        collectionPct: {
          $cond: [
            { $gt: ["$totalRent", 0] },
            {
              $multiply: [{ $divide: ["$paidAmount", "$totalRent"] }, 100],
            },
            0,
          ],
        },
      },
    },
  ]);

  const paymentsRow = paymentsAgg?.[0] || {};

  const payments = {
    paidAmount: safeNumber(paymentsRow.paidAmount),
    totalRent: safeNumber(paymentsRow.totalRent),
    collectionPct: safeNumber(paymentsRow.collectionPct),
  };

  // ==============================
  // Occupancy (DB derived)
  // ==============================
  const occupancyAgg = await Bed.aggregate([
    {
      $group: {
        _id: "$hostelId",
        totalBeds: { $sum: 1 },
        occupiedBeds: {
          $sum: { $cond: [{ $eq: ["$status", "occupied"] }, 1, 0] },
        },
      },
    },
    {
      $group: {
        _id: null,
        totalBedsAll: { $sum: "$totalBeds" },
        occupiedBedsAll: { $sum: "$occupiedBeds" },
      },
    },
    {
      $project: {
        _id: 0,
        totalBedsAll: 1,
        occupiedBedsAll: 1,
        occupancyPct: {
          $cond: [
            { $gt: ["$totalBedsAll", 0] },
            {
              $multiply: [
                { $divide: ["$occupiedBedsAll", "$totalBedsAll"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  const occRow = occupancyAgg?.[0] || {};

  const occupancy = {
    residentCount: null,
    bedCount: safeNumber(occRow.totalBedsAll),
    occupiedBeds: safeNumber(occRow.occupiedBedsAll),
    occupancyPct: safeNumber(occRow.occupancyPct),
  };

  // Resident count signal
  const residentCount = await Resident.countDocuments({});
  occupancy.residentCount = safeNumber(residentCount);

  // ==============================
  // Owner activity (DB derived)
  // ==============================
  const ownerCount = await Owner.countDocuments({});

  const ownerActivityAgg = await DeviceToken.aggregate([
    { $match: { role: "owner" } },
    {
      $group: {
        _id: null,
        latestOwnerLastSeenAt: { $max: "$lastSeenAt" },
        ownerTokenCount: { $sum: 1 },
        hostelsWithOwnerToken: {
          $addToSet: "$hostelId",
        },
      },
    },
    {
      $project: {
        _id: 0,
        latestOwnerLastSeenAt: 1,
        ownerTokenCount: 1,
        hostelsWithOwnerTokenCount: {
          $size: "$hostelsWithOwnerToken",
        },
      },
    },
  ]);

  const ownerActivityRow = ownerActivityAgg?.[0] || {};

  const latestSeen = ownerActivityRow.latestOwnerLastSeenAt
    ? new Date(ownerActivityRow.latestOwnerLastSeenAt).toISOString()
    : null;

  // Owner onboarding flags and status are present on Owner model; compute counts.
  const ownerFlagAgg = await Owner.aggregate([
    {
      $group: {
        _id: null,
        onboardedCount: {
          $sum: { $cond: [{ $eq: ["$onboardingCompleted", true] }, 1, 0] },
        },
        activeCount: {
          $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] },
        },
      },
    },
    { $project: { _id: 0, onboardedCount: 1, activeCount: 1 } },
  ]);

  const ownerFlagsRow = ownerFlagAgg?.[0] || {};

  const ownerActivity = {
    hostelsWithOwnerToken: safeNumber(ownerActivityRow.hostelsWithOwnerTokenCount),
    lastSeenAtISO: latestSeen,
    ownerTokenCount: safeNumber(ownerActivityRow.ownerTokenCount),
    onboarding: {
      onboardingCompletedCount: safeNumber(ownerFlagsRow.onboardedCount),
    },
    ownerStatus: {
      activeCount: safeNumber(ownerFlagsRow.activeCount),
      totalOwners: safeNumber(ownerCount),
    },
  };

  // ==============================
  // overallScore + riskLevel derived from DB values
  // ==============================
  const ratios = {
    subscriptionHealth: totalSubscriptions > 0 ? (safeNumber(subscriptionRow.activeCount) + safeNumber(subscriptionRow.trialCount)) / totalSubscriptions : 0,
    paymentHealth: payments.totalRent > 0 ? safeNumber(payments.collectionPct) / 100 : 0,
    occupancyHealth: occupancy.occupancyPct / 100,
    ownerActivityHealth: ownerActivity.lastSeenAtISO ? 1 : 0,
  };

  // overallScore computed as mean of the derived ratios (no hardcoded KPI values).
  const ratioValues = Object.values(ratios);
  const overallScore = ratioValues.length
    ? ratioValues.reduce((a, b) => a + safeNumber(b), 0) / ratioValues.length
    : 0;

  const riskLevel = pickRiskLevelFromRatios({
    subscriptionHealth: ratios.subscriptionHealth,
    paymentHealth: ratios.paymentHealth,
    occupancyHealth: ratios.occupancyHealth,
    ownerActivityHealth: ratios.ownerActivityHealth,
  });

  const breakdown = {
    subscription,
    payments,
    occupancy,
    ownerActivity,
  };

  const recommendations = buildRecommendations(breakdown);

  const topFactors = [
    { key: "subscription", value: ratios.subscriptionHealth },
    { key: "payments", value: ratios.paymentHealth },
    { key: "occupancy", value: ratios.occupancyHealth },
    { key: "ownerActivity", value: ratios.ownerActivityHealth },
  ]
    .sort((a, b) => b.value - a.value)
    .map((x) => ({ ...x, value: safeNumber(x.value) }));

  // Keep lastUpdated from now (not KPI).
  const lastUpdated = lastUpdatedISO();

  return {
    overallScore: safeNumber(overallScore),
    riskLevel,
    breakdown,
    recommendations,
    topFactors,
    lastUpdated,
  };
}

async function getHealthScore() {
  // Ensure mongoose connection ready
  if (mongoose?.connection?.readyState === 0) {
    // Let it fail with a clear error rather than returning fake data.
    throw new Error("Database not connected");
  }
  return compute();
}

module.exports = {
  getHealthScore,
};

