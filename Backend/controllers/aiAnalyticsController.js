const Payment = require("../models/Payment");
const Resident = require("../models/Resident");
const Room = require("../models/Room");

exports.getAnalytics = async (req, res) => {
  try {
    const hostelId = req.user.hostelId; // Assuming auth middleware provides req.user
    const mongoose = require("mongoose");
    const hId = new mongoose.Types.ObjectId(hostelId);

    const [residentsAgg, roomsAgg, paymentsAgg] = await Promise.all([
      Resident.aggregate([
        { $match: { hostelId: hId, status: "active" } },
        { $count: "count" }
      ]),
      Room.aggregate([
        { $match: { hostelId: hId } },
        { $group: {
            _id: null,
            totalBeds: { $sum: "$totalBeds" },
            occupiedBeds: { $sum: "$occupiedBeds" }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { hostelId: hId, status: "completed" } },
        { $group: {
            _id: null,
            totalRevenue: { $sum: "$paidAmount" }
          }
        }
      ])
    ]);

    const totalResidents = residentsAgg[0]?.count || 0;
    const roomStats = roomsAgg[0] || { totalBeds: 0, occupiedBeds: 0 };
    const totalBeds = roomStats.totalBeds || 0;
    const occupiedBeds = roomStats.occupiedBeds || 0;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
    const vacancy = totalBeds > 0 ? totalBeds - occupiedBeds : 0;
    
    const totalRevenue = paymentsAgg[0]?.totalRevenue || 0;
    const totalExpenses = 0; // Expenses model not yet available in schema

    res.json({
      success: true,
      data: {
        totalResidents,
        totalBeds,
        occupiedBeds,
        vacancy,
        occupancyRate: parseFloat(occupancyRate.toFixed(2)),
        totalRevenue,
        totalExpenses
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getTrends = async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const payments = await Payment.find({
      hostelId,
      status: "completed",
      createdAt: { $gte: sixMonthsAgo }
    });

    const monthlyRevenue = {};
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
      monthlyRevenue[month] += p.paidAmount;
    });

    const trends = Object.keys(monthlyRevenue).map(month => ({
      month,
      revenue: monthlyRevenue[month]
    }));

    res.json({
      success: true,
      data: trends
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getRecommendations = async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    
    const totalResidents = await Resident.countDocuments({ hostelId, status: "active" });
    const rooms = await Room.find({ hostelId });
    
    let totalBeds = 0;
    let occupiedBeds = 0;
    rooms.forEach(room => {
      totalBeds += room.totalBeds;
      occupiedBeds += room.occupiedBeds;
    });
    
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    const recommendations = [];
    if (occupancyRate < 70) {
      recommendations.push({
        type: "MARKETING",
        message: "Occupancy is below 70%. Consider running a discount or referral program to attract more residents.",
        priority: "High"
      });
    } else {
      recommendations.push({
        type: "OPERATIONS",
        message: "Occupancy is healthy. Focus on resident retention and facility maintenance.",
        priority: "Low"
      });
    }

    const unpaidPayments = await Payment.countDocuments({ hostelId, status: "pending" });
    if (unpaidPayments > 5) {
      recommendations.push({
        type: "FINANCE",
        message: `You have ${unpaidPayments} pending payments. Send reminders to improve cash flow.`,
        priority: "Medium"
      });
    }

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getPredictions = async (req, res) => {
  try {
    const hostelId = req.user.hostelId;
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const payments = await Payment.find({
      hostelId,
      status: "completed",
      createdAt: { $gte: threeMonthsAgo }
    });

    const monthlyRevenue = {};
    payments.forEach(p => {
      const month = new Date(p.createdAt).toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = 0;
      }
      monthlyRevenue[month] += p.paidAmount;
    });

    const revenues = Object.values(monthlyRevenue);
    const avgRevenue = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    res.json({
      success: true,
      data: {
        predictionMonth: nextMonth.toLocaleString('default', { month: 'short', year: 'numeric' }),
        predictedRevenue: parseFloat(avgRevenue.toFixed(2)),
        confidenceScore: revenues.length > 1 ? "Medium" : "Low"
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
