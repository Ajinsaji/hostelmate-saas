const Hostel = require("../../models/Hostel");
const Subscription = require("../../models/Subscription");
const Owner = require("../../models/Owner");
const Room = require("../../models/Room");
const Resident = require("../../models/Resident");
const Payment = require("../../models/Payment");
const HostelRequest = require("../../models/HostelRequest");

const safeNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Super Admin Dashboard Overview (LIVE MongoDB aggregations only)
 */
async function getDashboardOverview() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const last30Start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalHostels,
    activeHostels,
    trialHostels,
    paidHostels,
    expiredSubscriptions,
    deletedHostels,
    pendingHostels,
    newHostelsToday,
    newHostelsThisWeek,
    totalOwners,
    newOwnersToday,
    newOwnersThisWeek,
    totalResidents,
    newResidentsToday,
    newResidentsThisWeek,
    totalRooms,
    occupiedRoomsAgg,
    monthlyRevenueAgg,
    todayRevenueAgg,
    pendingPayments,
    pendingApprovals,
  ] = await Promise.all([
    Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: { $ne: true } }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: { $ne: true }, subscriptionStatus: { $in: ["active", "approved", undefined] } }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: { $ne: true }, $or: [{ subscriptionStatus: "trial" }, { isTrial: true }] }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: { $ne: true }, subscriptionStatus: "active" }),
    Subscription.countDocuments({ subscriptionStatus: "expired" }),
    Hostel.countDocuments({ isDeleted: true }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, pendingActivation: true }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfToday } }),
    Hostel.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: startOfWeek } }),
    Owner.countDocuments({ status: "active" }),
    Owner.countDocuments({ status: "active", createdAt: { $gte: startOfToday } }),
    Owner.countDocuments({ status: "active", createdAt: { $gte: startOfWeek } }),
    Resident.countDocuments({ status: "active" }),
    Resident.countDocuments({ status: "active", createdAt: { $gte: startOfToday } }),
    Resident.countDocuments({ status: "active", createdAt: { $gte: startOfWeek } }),
    Room.countDocuments(),
    Room.aggregate([
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          occupiedRooms: {
            $sum: { $cond: [{ $gt: ["$occupiedBeds", 0] }, 1, 0] },
          },
        },
      },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ["success", "Paid", "paid"] }, createdAt: { $gte: last30Start } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
    Payment.aggregate([
      { $match: { status: { $in: ["success", "Paid", "paid"] }, createdAt: { $gte: startOfToday } } },
      { $group: { _id: null, total: { $sum: "$paidAmount" } } },
    ]),
    Payment.countDocuments({ status: "pending" }),
    HostelRequest ? HostelRequest.countDocuments({ status: { $in: ["pending", "activation_pending"] } }) : 0,
  ]);

  const occupiedRooms = safeNumber(occupiedRoomsAgg?.[0]?.occupiedRooms, 0);
  const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;
  const monthlyRevenue = safeNumber(monthlyRevenueAgg?.[0]?.total, 0);
  const todayRevenue = safeNumber(todayRevenueAgg?.[0]?.total, 0);

  return {
    totalHostels: safeNumber(totalHostels, 0),
    activeHostels: safeNumber(activeHostels, 0),
    trialHostels: safeNumber(trialHostels, 0),
    paidHostels: safeNumber(paidHostels, 0),
    expiredSubscriptions: safeNumber(expiredSubscriptions, 0),
    deletedHostels: safeNumber(deletedHostels, 0),
    pendingHostels: safeNumber(pendingHostels, 0),
    newHostelsToday: safeNumber(newHostelsToday, 0),
    newHostelsThisWeek: safeNumber(newHostelsThisWeek, 0),
    totalOwners: safeNumber(totalOwners, 0),
    newOwnersToday: safeNumber(newOwnersToday, 0),
    newOwnersThisWeek: safeNumber(newOwnersThisWeek, 0),
    totalResidents: safeNumber(totalResidents, 0),
    newResidentsToday: safeNumber(newResidentsToday, 0),
    newResidentsThisWeek: safeNumber(newResidentsThisWeek, 0),
    totalRooms: safeNumber(totalRooms, 0),
    occupiedRooms,
    occupancyRate,
    monthlyRevenue,
    todayRevenue,
    pendingPayments: safeNumber(pendingPayments, 0),
    pendingApprovals: safeNumber(pendingApprovals, 0),
    newSignupsThisMonth: safeNumber(newHostelsThisWeek, 0),
  };
}

module.exports = { getDashboardOverview };



