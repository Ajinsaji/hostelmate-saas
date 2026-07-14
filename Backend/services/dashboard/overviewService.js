const Hostel = require("../../models/Hostel");
const Subscription = require("../../models/Subscription");
const Owner = require("../../models/Owner");
const Room = require("../../models/Room");
const Resident = require("../../models/Resident");
const Payment = require("../../models/Payment");

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const monthWindow = () => {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
};

/**
 * Super Admin Dashboard Overview (LIVE MongoDB aggregations only)
 */
async function getDashboardOverview() {
  const { start: monthStart, end: monthEnd } = monthWindow();
  const last30Start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // One $facet to minimize scans: compute all requested counts from their own collections.
  // Note: $facet runs server-side and avoids JS loops for metric math.
  const [facetResult] = await Subscription.aggregate([
    {
      $facet: {
        hostelsBySubscription: [
          {
            $group: {
              _id: null,
              totalHostels: { $addToSet: "$hostelId" },
              trialHostels: {
                $addToSet: {
                  $cond: [{ $eq: ["$subscriptionStatus", "trial"] }, "$hostelId", "$$REMOVE"],
                },
              },
              paidHostels: {
                $addToSet: {
                  $cond: [{ $in: ["$subscriptionStatus", ["active"]] }, "$hostelId", "$$REMOVE"],
                },
              },
              expiredSubscriptions: {
                $sum: { $cond: [{ $eq: ["$subscriptionStatus", "expired"] }, 1, 0] },
              },
              activeHostels: {
                $sum: { $cond: [{ $eq: ["$subscriptionStatus", "active"] }, 1, 0] },
              },
            },
          },
          {
            $project: {
              _id: 0,
              totalHostels: { $size: "$totalHostels" },
              trialHostels: { $size: "$trialHostels" },
              paidHostels: { $size: "$paidHostels" },
              expiredSubscriptions: 1,
              activeHostels: 1,
            },
          },
        ],
      },
    },
  ]);

  const hostelFacet = facetResult?.hostelsBySubscription?.[0] || {
    totalHostels: 0,
    trialHostels: 0,
    paidHostels: 0,
    expiredSubscriptions: 0,
    activeHostels: 0,
  };

  // Independent aggregations for the remaining collections (still aggregation-only; parallelized).
  const [ownersAgg, residentsAgg, roomsAgg, occupancyAgg, revenueAgg, pendingPaymentsAgg, newSignupsAgg] =
    await Promise.all([
      Owner.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalOwners: { $sum: 1 } } },
        { $project: { _id: 0, totalOwners: 1 } },
      ]),
      Resident.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: null, totalResidents: { $sum: 1 } } },
        { $project: { _id: 0, totalResidents: 1 } },
      ]),
      Room.aggregate([
        { $group: { _id: null, totalRooms: { $sum: 1 } } },
        { $project: { _id: 0, totalRooms: 1 } },
      ]),
      Room.aggregate([
        {
          $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            occupiedRooms: {
              $sum: {
                $cond: [{ $gt: ["$occupiedBeds", 0] }, 1, 0],
              },
            },
          },
        },
        {
          $project: {
            _id: 0,
            totalRooms: 1,
            occupiedRooms: 1,
            occupancyRate: {
              $cond: [
                { $eq: ["$totalRooms", 0] },
                0,
                { $divide: ["$occupiedRooms", "$totalRooms"] },
              ],
            },
          },
        },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "success",
            createdAt: { $gte: last30Start },
          },
        },
        {
          $group: { _id: null, monthlyRevenue: { $sum: "$paidAmount" } },
        },
        { $project: { _id: 0, monthlyRevenue: 1 } },
      ]),
      Payment.aggregate([
        {
          $match: {
            status: "pending",
          },
        },
        { $group: { _id: null, pendingPayments: { $sum: 1 } } },
        { $project: { _id: 0, pendingPayments: 1 } },
      ]),
      Resident.aggregate([
        {
          $match: {
            status: "active",
            joinDate: { $gte: monthStart, $lt: monthEnd },
          },
        },
        { $group: { _id: null, newSignupsThisMonth: { $sum: 1 } } },
        { $project: { _id: 0, newSignupsThisMonth: 1 } },
      ]),
    ]);

  const totalOwners = safeNumber(ownersAgg?.[0]?.totalOwners, 0);
  const totalResidents = safeNumber(residentsAgg?.[0]?.totalResidents, 0);
  const totalRooms = safeNumber(roomsAgg?.[0]?.totalRooms, 0);
  const occupiedRooms = safeNumber(occupancyAgg?.[0]?.occupiedRooms, 0);
  const occupancyRate = safeNumber(occupancyAgg?.[0]?.occupancyRate, 0);
  const monthlyRevenue = safeNumber(revenueAgg?.[0]?.monthlyRevenue, 0);
  const pendingPayments = safeNumber(pendingPaymentsAgg?.[0]?.pendingPayments, 0);
  const newSignupsThisMonth = safeNumber(newSignupsAgg?.[0]?.newSignupsThisMonth, 0);

  // required exact response fields
  const response = {
    totalHostels: safeNumber(hostelFacet.totalHostels, 0),
    activeHostels: safeNumber(hostelFacet.activeHostels, 0),
    trialHostels: safeNumber(hostelFacet.trialHostels, 0),
    paidHostels: safeNumber(hostelFacet.paidHostels, 0),
    totalOwners,
    totalResidents,
    totalRooms,
    occupiedRooms,
    occupancyRate,
    monthlyRevenue,
    pendingPayments,
    expiredSubscriptions: safeNumber(hostelFacet.expiredSubscriptions, 0),
    newSignupsThisMonth,
  };

  return response;
}

module.exports = { getDashboardOverview };


