const Resident = require("../models/Resident");
const Bed = require("../models/Bed");
const Room = require("../models/Room");
const RentPayment = require("../models/RentPayment");
const Expense = require("../models/Expense");
const Hostel = require("../models/Hostel");

class AnalyticsService {
  async getDashboard(workspaceId, hostelId, timeframe = "30d") {
    const validTimeframes = new Set(["30d", "90d", "365d"]);
    const selectedTimeframe = validTimeframes.has(timeframe) ? timeframe : "30d";
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCDate(startDate.getUTCDate() - Number.parseInt(selectedTimeframe, 10));

    // Context middleware authorizes the active hostel. Without one, aggregate only
    // hostels belonging to the authenticated workspace (never by client-supplied ID).
    const hostels = hostelId
      ? [{ _id: hostelId }]
      : await Hostel.find({ workspaceId }).select("_id").lean();
    const hostelIds = hostels.map((hostel) => hostel._id);
    if (hostelIds.length === 0) {
      return {
        totalResidents: 0,
        totalBeds: 0,
        occupiedBeds: 0,
        occupancyRate: 0,
        periodRevenue: 0,
        periodExpenses: 0,
        netProfit: 0,
        periodStart: startDate,
        periodEnd: endDate,
      };
    }

    const tenantFilter = { hostelId: { $in: hostelIds } };
    const totalResidents = await Resident.countDocuments({
      ...tenantFilter,
      isDeleted: false,
      status: { $in: ["Active", "active"] },
    });
    const totalBeds = await Bed.countDocuments({ ...tenantFilter, isDeleted: false });
    const occupiedBeds = await Bed.countDocuments({
      ...tenantFilter,
      isDeleted: false,
      status: { $in: ["Occupied", "occupied"] },
    });
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const revenueAgg = await RentPayment.aggregate([
      {
        $match: {
          ...tenantFilter,
          status: "Completed",
          paymentDate: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const periodRevenue = revenueAgg[0]?.total || 0;

    const expAgg = await Expense.aggregate([
      {
        $match: {
          ...tenantFilter,
          status: "Paid",
          isDeleted: false,
          expenseDate: { $gte: startDate, $lte: endDate },
        },
      },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]);
    const periodExpenses = expAgg[0]?.total || 0;

    return {
      totalResidents,
      totalBeds,
      occupiedBeds,
      occupancyRate,
      periodRevenue,
      periodExpenses,
      netProfit: periodRevenue - periodExpenses,
      periodStart: startDate,
      periodEnd: endDate,
    };
  }

  async getRevenue() {
    return { success: false, message: "Revenue trend data is not currently calculated."
    };
  }

  async getOccupancy() {
    return { success: false, message: "Historical occupancy trend data is not currently calculated." };
  }

  async getFinance() {
    return { success: false, message: "Financial breakdown data is not currently calculated." };
  }

  async getResidents() {
    return { success: false, message: "Resident trend data is not currently calculated." };
  }
}

module.exports = new AnalyticsService();
