const RentInvoice = require("../models/RentInvoice");
const RentPayment = require("../models/RentPayment");
const SecurityDeposit = require("../models/SecurityDeposit");
const ExcelJS = require("exceljs");
const { logger } = require("../utils/logger");
const { getISTStartOfDay, getISTEndOfDay, getISTStartOfMonth, getISTEndOfMonth, formatISTDate } = require("../utils/timezoneHelper");

/**
 * Calculates Dashboard KPIs & Financial Metrics in Indian Standard Time (IST)
 * @param {string|ObjectId} hostelId
 * @param {Date|string|number} [refDate=new Date()] Optional reference date for deterministic testing
 */
async function getFinancialDashboardStats(hostelId, refDate = new Date()) {
  const startOfDay = getISTStartOfDay(refDate);
  const endOfDay = getISTEndOfDay(refDate);
  const startOfMonth = getISTStartOfMonth(refDate);
  const endOfMonth = getISTEndOfMonth(refDate);

  const [todayPayments, monthPayments, pendingInvoices, overdueInvoices, deposits, refunds] = await Promise.all([
    RentPayment.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), paymentDate: { $gte: startOfDay, $lte: endOfDay }, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    RentPayment.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), paymentDate: { $gte: startOfMonth, $lte: endOfMonth }, status: "Completed" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    RentInvoice.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), paymentStatus: { $in: ["Pending", "Partially Paid"] }, isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$balanceAmount" } } },
    ]),
    RentInvoice.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId), paymentStatus: "Overdue", isDeleted: false } },
      { $group: { _id: null, total: { $sum: "$balanceAmount" } } },
    ]),
    SecurityDeposit.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId) } },
      { $group: { _id: null, total: { $sum: "$depositAmount" }, active: { $sum: "$balance" } } },
    ]),
    SecurityDeposit.aggregate([
      { $match: { hostelId: new (require("mongoose").Types.ObjectId)(hostelId) } },
      { $group: { _id: null, total: { $sum: "$refundedAmount" } } },
    ]),
  ]);

  const todayCollection = todayPayments[0]?.total || 0;
  const monthlyCollection = monthPayments[0]?.total || 0;
  const pendingCollection = pendingInvoices[0]?.total || 0;
  const overdueCollection = overdueInvoices[0]?.total || 0;
  const totalDeposits = deposits[0]?.active || 0;
  const totalRefunds = refunds[0]?.total || 0;
  const outstandingAmount = pendingCollection + overdueCollection;

  const totalBilled = monthlyCollection + pendingCollection;
  const collectionRate = totalBilled > 0 ? Math.round((monthlyCollection / totalBilled) * 100) : 100;

  return {
    todayCollection,
    monthlyCollection,
    pendingCollection,
    overdueCollection,
    totalDeposits,
    totalRefunds,
    outstandingAmount,
    collectionRate,
  };
}

/**
 * Generates Excel Report Buffer for Rent Payments
 */
async function generatePaymentsExcelReport(hostelId) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Rent Collections");

  worksheet.columns = [
    { header: "Payment Number", key: "paymentNumber", width: 20 },
    { header: "Resident Name", key: "residentName", width: 25 },
    { header: "Payment Date", key: "paymentDate", width: 15 },
    { header: "Amount (INR)", key: "amount", width: 15 },
    { header: "Method", key: "paymentMethod", width: 15 },
    { header: "Ref Number", key: "transactionReference", width: 20 },
    { header: "Status", key: "status", width: 15 },
  ];

  const payments = await RentPayment.find({ hostelId, status: "Completed" })
    .populate("residentId", "fullName")
    .sort({ paymentDate: -1 });

  payments.forEach((p) => {
    worksheet.addRow({
      paymentNumber: p.paymentNumber,
      residentName: p.residentId?.fullName || "Resident",
      paymentDate: formatISTDate(p.paymentDate),
      amount: p.amount,
      paymentMethod: p.paymentMethod,
      transactionReference: p.transactionReference || "N/A",
      status: p.status,
    });
  });

  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  getFinancialDashboardStats,
  generatePaymentsExcelReport,
};
