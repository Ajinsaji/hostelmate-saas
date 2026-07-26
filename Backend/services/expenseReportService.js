const Expense = require("../models/Expense");
const RentPayment = require("../models/RentPayment");
const ExcelJS = require("exceljs");
const { logger } = require("../utils/logger");

async function getExpenseDashboardStats(hostelId) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [todayExpenses, monthExpenses, pendingApprovals, recurringDue] = await Promise.all([
    Expense.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), expenseDate: { $gte: startOfDay }, isDeleted: false, status: { $in: ["Approved", "Paid"] } } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
    Expense.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), expenseDate: { $gte: startOfMonth }, isDeleted: false, status: { $in: ["Approved", "Paid"] } } },
      { $group: { _id: null, total: { $sum: "$netAmount" } } },
    ]),
    Expense.countDocuments({ hostelId, status: "Pending Approval", isDeleted: false }),
    Expense.countDocuments({ hostelId, expenseType: "Recurring", isDeleted: false }),
  ]);

  const today = todayExpenses[0]?.total || 0;
  const month = monthExpenses[0]?.total || 0;

  // Real-time Profit & Loss calculation
  const monthRentCollections = await RentPayment.aggregate([
    { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), paymentDate: { $gte: startOfMonth }, status: "Completed" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const totalIncome = monthRentCollections[0]?.total || 0;
  const netProfitLoss = totalIncome - month;
  const profitMarginRate = totalIncome > 0 ? Math.round((netProfitLoss / totalIncome) * 100) : 0;

  return {
    todayExpenses: today,
    monthlyExpenses: month,
    pendingApprovals,
    recurringDue,
    totalIncome,
    netProfitLoss,
    profitMarginRate,
  };
}

async function generateExpensesExcelReport(hostelId) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Hostel Operational Expenses");

  worksheet.columns = [
    { header: "Expense #", key: "expenseNumber", width: 20 },
    { header: "Title", key: "title", width: 25 },
    { header: "Category", key: "categoryName", width: 20 },
    { header: "Vendor", key: "vendorName", width: 20 },
    { header: "Date", key: "expenseDate", width: 15 },
    { header: "Amount (INR)", key: "netAmount", width: 15 },
    { header: "Payment Method", key: "paymentMethod", width: 15 },
    { header: "Status", key: "status", width: 15 },
  ];

  const expenses = await Expense.find({ hostelId, isDeleted: false })
    .populate("categoryId", "categoryName")
    .populate("vendorId", "vendorName")
    .sort({ expenseDate: -1 });

  expenses.forEach((e) => {
    worksheet.addRow({
      expenseNumber: e.expenseNumber,
      title: e.title,
      categoryName: e.categoryId?.categoryName || "General",
      vendorName: e.vendorId?.vendorName || "Direct",
      expenseDate: new Date(e.expenseDate).toLocaleDateString(),
      netAmount: e.netAmount,
      paymentMethod: e.paymentMethod,
      status: e.status,
    });
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  getExpenseDashboardStats,
  generateExpensesExcelReport,
};
