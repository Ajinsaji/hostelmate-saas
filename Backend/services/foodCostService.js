const KitchenPurchase = require("../models/KitchenPurchase");
const WasteLog = require("../models/WasteLog");
const MealAttendance = require("../models/MealAttendance");
const Resident = require("../models/Resident");
const ExcelJS = require("exceljs");
const { logger } = require("../utils/logger");

async function getKitchenDashboardStats(hostelId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayAttendance, guestsServed, extraMeals, monthPurchases, monthWaste, activeResidents] = await Promise.all([
    MealAttendance.countDocuments({ hostelId, attendanceDate: { $gte: startOfDay }, status: "Present" }),
    MealAttendance.countDocuments({ hostelId, attendanceDate: { $gte: startOfDay }, status: "Guest Meal" }),
    MealAttendance.countDocuments({ hostelId, attendanceDate: { $gte: startOfDay }, status: "Extra Meal" }),
    KitchenPurchase.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), purchaseDate: { $gte: startOfMonth }, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } },
    ]),
    WasteLog.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), wasteDate: { $gte: startOfMonth } } },
      { $group: { _id: null, total: { $sum: "$costImpact" } } },
    ]),
    Resident.countDocuments({ hostelId, status: { $in: ["Active", "active"] }, isDeleted: false }),
  ]);

  const monthlyFoodCost = monthPurchases[0]?.total || 0;
  const wastageCost = monthWaste[0]?.total || 0;
  const todayFoodCost = Math.round(monthlyFoodCost / 30);

  const perResidentMonthlyCost = activeResidents > 0 ? Math.round(monthlyFoodCost / activeResidents) : 0;
  const perMealCost = activeResidents > 0 ? Math.round(monthlyFoodCost / (activeResidents * 90)) : 0;

  return {
    todayMealsCount: todayAttendance,
    residentsServed: activeResidents,
    guestsServed,
    extraMeals,
    todayFoodCost,
    monthlyFoodCost,
    wastageCost,
    perResidentMonthlyCost,
    perMealCost,
  };
}

async function generateKitchenExcelReport(hostelId) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Kitchen Purchases & Costing");

  worksheet.columns = [
    { header: "Purchase Date", key: "purchaseDate", width: 15 },
    { header: "Vendor", key: "vendorName", width: 25 },
    { header: "Invoice #", key: "invoiceNumber", width: 20 },
    { header: "Total Amount (INR)", key: "totalAmount", width: 18 },
    { header: "Status", key: "status", width: 15 },
  ];

  const purchases = await KitchenPurchase.find({ hostelId })
    .populate("vendorId", "vendorName")
    .sort({ purchaseDate: -1 });

  purchases.forEach((p) => {
    worksheet.addRow({
      purchaseDate: new Date(p.purchaseDate).toLocaleDateString(),
      vendorName: p.vendorId?.vendorName || "Direct",
      invoiceNumber: p.invoiceNumber || "N/A",
      totalAmount: p.totalAmount,
      status: p.status,
    });
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  getKitchenDashboardStats,
  generateKitchenExcelReport,
};
