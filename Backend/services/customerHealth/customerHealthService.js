const mongoose = require("mongoose");

const Hostel = require("../../models/Hostel");
const Subscription = require("../../models/Subscription");
const Payment = require("../../models/Payment");
const Owner = require("../../models/Owner");
const Resident = require("../../models/Resident");
const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const DeviceToken = require("../../models/DeviceToken");

// Phase 4.3.6 — Customer Health live metrics derived ONLY from existing models.
// No thresholds are invented. “Risk” values are returned as underlying aggregates
// computed from actual status/end-date/activity data.

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function toISODate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString();
}

async function getCustomerHealth() {
  // ============================================================
  // 1) Subscription status breakdown (Trial / Active / Expired)
  // ============================================================
  const now = new Date();

  const subscriptionAgg = await Subscription.aggregate([
    {
      $addFields: {
        // Use both the enum status and end dates where present.
        // This does not create a “business rule”; it simply exposes what the DB says.
        computedStatus: {
          $switch: {
            branches: [
              {
                case: {
                  $eq: ["$subscriptionStatus", "trial"],
                },
                then: "trial",
              },
              {
                case: {
                  $eq: ["$subscriptionStatus", "active"],
                },
                then: "active",
              },
              {
                case: {
                  $eq: ["$subscriptionStatus", "expired"],
                },
                then: "expired",
              },
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
        _id: "$computedStatus",
        count: { $sum: 1 },
        hostels: { $addToSet: "$hostelId" },
      },
    },
    {
      $project: {
        _id: 0,
        status: "$_id",
        count: 1,
        hostelIds: 1,
      },
    },
  ]);

  const statusMap = subscriptionAgg.reduce((acc, row) => {
    acc[row.status] = row.count;
    return acc;
  }, {});

  const trialHostels = safeNumber(statusMap.trial);
  const activeHostels = safeNumber(statusMap.active);
  const expiredHostels = safeNumber(statusMap.expired);

  // ============================================================
  // 2) Occupancy % (Residents vs Beds)
  // ============================================================
  // We compute totals from Resident + Bed availability.
  // Resident collection already has hostelId; Bed has hostelId too.
  const [occupancyAgg] = await Bed.aggregate([
    {
      $group: {
        _id: "$hostelId",
        totalBeds: { $sum: 1 },
        occupiedBeds: {
          $sum: {
            $cond: [{ $eq: ["$status", "occupied"] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: Resident.collection.name,
        localField: "_id",
        foreignField: "hostelId",
        as: "residents",
        pipeline: [
          { $match: { status: "active" } },
          { $group: { _id: "$hostelId", activeResidents: { $sum: 1 } } },
        ],
      },
    },
    {
      $addFields: {
        activeResidents: {
          $ifNull: [
            { $arrayElemAt: ["$residents.activeResidents", 0] },
            0,
          ],
        },
      },
    },
    {
      $project: {
        totalBeds: 1,
        occupiedBeds: 1,
        activeResidents: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalBedsAll: { $sum: "$totalBeds" },
        occupiedBedsAll: { $sum: "$occupiedBeds" },
        activeResidentsAll: { $sum: "$activeResidents" },
      },
    },
    {
      $project: {
        _id: 0,
        totalBedsAll: 1,
        occupiedBedsAll: 1,
        activeResidentsAll: 1,
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

  const occupancyPct = occupancyAgg?.occupancyPct ?? 0;

  // ============================================================
  // 3) Collection %
  // ============================================================
  // Payment docs already contain totalRent and paidAmount.
  // We return collectionPct = sum(paidAmount) / sum(totalRent).
  const paymentAgg = await Payment.aggregate([
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
              $multiply: [
                { $divide: ["$paidAmount", "$totalRent"] },
                100,
              ],
            },
            0,
          ],
        },
      },
    },
  ]);

  const collectionPct = paymentAgg?.[0]?.collectionPct ?? 0;

  // ============================================================
  // 4) Renewal & Churn risk (returned as underlying aggregates)
  // ============================================================
  // IMPORTANT: No invented windows.
  // We return:
  //  - renewalCandidates: active subscriptions with subscriptionEndDate set and present.
  //  - renewalDueCount: those that have already ended but subscriptionStatus is still active/trial (data inconsistency).
  //  - churnCandidates: expired subscriptions.

  const renewalChurnAgg = await Subscription.aggregate([
    {
      $addFields: {
        isEndDatePresent: { $ne: ["$subscriptionEndDate", null] },
        hasEnded: {
          $cond: [
            { $ne: ["$subscriptionEndDate", null] },
            { $lte: ["$subscriptionEndDate", now] },
            false,
          ],
        },
      },
    },
    {
      $group: {
        _id: null,
        renewalCandidates: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$subscriptionStatus", "active"] },
                  { $eq: ["$isEndDatePresent", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        renewalDueCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$subscriptionStatus", "active"] },
                  { $eq: ["$hasEnded", true] },
                ],
              },
              1,
              0,
            ],
          },
        },
        churnCandidates: {
          $sum: {
            $cond: [
              {
                $in: ["$subscriptionStatus", ["expired", "cancelled"]],
              },
              1,
              0,
            ],
          },
        },
        lastReminderMissingCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$subscriptionStatus", "active"] },
                  { $eq: ["$lastReminderSentAt", null] },
                ],
              },
              1,
              0,
            ],
          },
        },
        // Provide basic snapshots for UI labeling
        subscriptionStatusCounts: {
          $push: { status: "$subscriptionStatus" },
        },
      },
    },
  ]);

  const renewalChurn = renewalChurnAgg?.[0] || {};

  // ============================================================
  // 5) Owner activity
  // ============================================================
  // We use DeviceToken.lastSeenAt for activity.
  const ownerActivityAgg = await DeviceToken.aggregate([
    {
      $match: {
        role: "owner",
        hostelId: { $ne: null },
      },
    },
    {
      $group: {
        _id: "$hostelId",
        lastSeenAt: { $max: "$lastSeenAt" },
        tokenCount: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: null,
        hostelsWithAnyOwnerToken: { $sum: 1 },
        latestOwnerLastSeenAt: { $max: "$lastSeenAt" },
      },
    },
  ]);

  const ownerActivity = ownerActivityAgg?.[0] || {};

  // ============================================================
  // 6) Top / Lowest performing hostels
  // ============================================================
  // We rank hostels using occupancyPct and collectionPct (derived from DB).

  const hostelPerfAgg = await Hostel.aggregate([
    {
      $lookup: {
        from: Room.collection.name,
        localField: "_id",
        foreignField: "hostelId",
        as: "rooms",
        pipeline: [
          {
            $group: {
              _id: "$hostelId",
              totalBedsRooms: { $sum: "$totalBeds" },
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: Bed.collection.name,
        localField: "_id",
        foreignField: "hostelId",
        as: "beds",
        pipeline: [
          {
            $group: {
              _id: "$hostelId",
              occupiedBeds: {
                $sum: {
                  $cond: [{ $eq: ["$status", "occupied"] }, 1, 0],
                },
              },
              totalBeds: { $sum: 1 },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalBeds: {
          $ifNull: [
            { $arrayElemAt: ["$beds.totalBeds", 0] },
            { $arrayElemAt: ["$rooms.totalBedsRooms", 0] },
          ],
        },
        occupiedBeds: { $ifNull: [{ $arrayElemAt: ["$beds.occupiedBeds", 0] }, 0] },
      },
    },
    {
      $addFields: {
        occupancyPct: {
          $cond: [
            { $gt: ["$totalBeds", 0] },
            { $multiply: [{ $divide: ["$occupiedBeds", "$totalBeds"] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $lookup: {
        from: Payment.collection.name,
        localField: "_id",
        foreignField: "hostelId",
        as: "payments",
        pipeline: [
          {
            $group: {
              _id: "$hostelId",
              totalRent: { $sum: { $ifNull: ["$totalRent", 0] } },
              paidAmount: { $sum: { $ifNull: ["$paidAmount", 0] } },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalRent: { $ifNull: [{ $arrayElemAt: ["$payments.totalRent", 0] }, 0] },
        paidAmount: { $ifNull: [{ $arrayElemAt: ["$payments.paidAmount", 0] }, 0] },
      },
    },
    {
      $addFields: {
        collectionPct: {
          $cond: [
            { $gt: ["$totalRent", 0] },
            { $multiply: [{ $divide: ["$paidAmount", "$totalRent"] }, 100] },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 1,
        hostelName: 1,
        occupancyPct: 1,
        collectionPct: 1,
        totalBeds: 1,
        occupiedBeds: 1,
        totalRent: 1,
        paidAmount: 1,
      },
    },
  ]);

  const ranked = (hostelPerfAgg || []).map((h) => ({
    hostelId: h._id,
    hostelName: h.hostelName,
    occupancyPct: h.occupancyPct,
    collectionPct: h.collectionPct,
    performanceScore: safeNumber(h.occupancyPct) + safeNumber(h.collectionPct),
    totalBeds: h.totalBeds,
    occupiedBeds: h.occupiedBeds,
    totalRent: h.totalRent,
    paidAmount: h.paidAmount,
  }));

  ranked.sort((a, b) => b.performanceScore - a.performanceScore);

  // UI list size is not “business rules”; it’s presentation.
  const topN = 5;
  const bottomN = 5;

  const topPerformingHostels = ranked.slice(0, topN);
  const lowestPerformingHostels = ranked.slice(-bottomN).reverse();

  return {
    trialHostels,
    activeHostels,
    expiredHostels,
    occupancyPct,
    collectionPct,

    renewalRisk: {
      renewalCandidates: renewalChurn.renewalCandidates || 0,
      renewalDueCount: renewalChurn.renewalDueCount || 0,
      // Provide raw date snapshots to allow UI to interpret.
      now: now.toISOString(),
    },

    churnRisk: {
      churnCandidates: renewalChurn.churnCandidates || 0,
      lastReminderMissingCount: renewalChurn.lastReminderMissingCount || 0,
      now: now.toISOString(),
    },

    ownerActivity: {
      hostelsWithAnyOwnerToken: ownerActivity.hostelsWithAnyOwnerToken || 0,
      latestOwnerLastSeenAt: toISODate(ownerActivity.latestOwnerLastSeenAt),
    },

    topPerformingHostels,
    lowestPerformingHostels,
  };
}

module.exports = {
  getCustomerHealth,
};

