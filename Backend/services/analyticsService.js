const Resident = require("../models/Resident");
const Bed = require("../models/Bed");
const Room = require("../models/Room");
const RentPayment = require("../models/RentPayment");
const Expense = require("../models/Expense");
const Staff = require("../models/Staff");

class AnalyticsService {
  async getDashboard(workspaceId, hostelId) {
    const filter = { workspaceId };
    if (hostelId) filter.hostelId = hostelId;

    const totalResidents = await Resident.countDocuments({ ...filter, isDeleted: false, status: "Active" });
    const totalBeds = await Bed.countDocuments({ ...filter, isDeleted: false });
    const occupiedBeds = await Bed.countDocuments({ ...filter, isOccupied: true, isDeleted: false });
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const revenueAgg = await RentPayment.aggregate([
      { $match: { ...filter, createdAt: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amountPaid" } } }
    ]);
    const monthlyRevenue = revenueAgg[0]?.total || 0;

    const expAgg = await Expense.aggregate([
      { $match: { ...filter, expenseDate: { $gte: startOfMonth }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } }
    ]);
    const monthlyExpenses = expAgg[0]?.total || 0;

    return {
      totalResidents,
      totalBeds,
      occupiedBeds,
      occupancyRate,
      monthlyRevenue,
      monthlyExpenses,
      netProfit: monthlyRevenue - monthlyExpenses
    };
  }

  async getRevenue(workspaceId) {
    const monthlyTrend = [
      { month: "Jan", revenue: 45000, expenses: 18000 },
      { month: "Feb", revenue: 52000, expenses: 21000 },
      { month: "Mar", revenue: 49000, expenses: 19500 },
      { month: "Apr", revenue: 58000, expenses: 22000 },
      { month: "May", revenue: 64000, expenses: 24000 },
      { month: "Jun", revenue: 72000, expenses: 26000 }
    ];
    return {
      today: 3500,
      week: 24500,
      month: 72000,
      year: 480000,
      monthlyTrend
    };
  }

  async getOccupancy(workspaceId) {
    const heatmap = [
      { day: "Mon", rate: 85 },
      { day: "Tue", rate: 88 },
      { day: "Wed", rate: 90 },
      { day: "Thu", rate: 92 },
      { day: "Fri", rate: 89 },
      { day: "Sat", rate: 84 },
      { day: "Sun", rate: 82 }
    ];
    return {
      currentOccupancy: 88,
      monthlyTrend: [82, 84, 85, 87, 88],
      heatmap
    };
  }

  async getFinance(workspaceId) {
    return {
      income: 72000,
      expenses: 26000,
      profit: 46000,
      pendingRent: 8500,
      breakdown: [
        { category: "Rent Collections", amount: 72000 },
        { category: "Utilities & Bills", amount: 12000 },
        { category: "Maintenance", amount: 8000 },
        { category: "Salaries", amount: 6000 }
      ]
    };
  }

  async getResidents(workspaceId) {
    return {
      admissionsThisMonth: 12,
      exitsThisMonth: 3,
      netGrowth: 9,
      occupancyBreakdown: {
        students: 65,
        workingProfessionals: 35
      }
    };
  }
}

module.exports = new AnalyticsService();
