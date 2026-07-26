const Invoice = require("../models/Invoice");
const HostelSubscription = require("../models/HostelSubscription");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const ExcelJS = require("exceljs");
const { logger } = require("../utils/logger");

/**
 * Generates an Excel Workbook buffer for Revenue & Invoices Report
 */
async function generateRevenueExcelReport() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Revenue & Invoices");

  worksheet.columns = [
    { header: "Invoice Number", key: "invoiceNumber", width: 20 },
    { header: "Hostel Name", key: "hostelName", width: 25 },
    { header: "Billing Date", key: "billingDate", width: 15 },
    { header: "Plan Name", key: "planName", width: 15 },
    { header: "Plan Price (INR)", key: "planPrice", width: 15 },
    { header: "Active Residents", key: "activeResidents", width: 15 },
    { header: "Resident Charge (INR)", key: "residentCharge", width: 20 },
    { header: "Total Amount (INR)", key: "totalAmount", width: 20 },
    { header: "Payment Status", key: "paymentStatus", width: 15 },
  ];

  const invoices = await Invoice.find().populate("hostelId", "hostelName").sort({ createdAt: -1 });

  invoices.forEach((inv) => {
    worksheet.addRow({
      invoiceNumber: inv.invoiceNumber,
      hostelName: inv.hostelId?.hostelName || "Unknown Hostel",
      billingDate: new Date(inv.billingDate).toLocaleDateString(),
      planName: inv.planName,
      planPrice: inv.planPrice,
      activeResidents: inv.activeResidents,
      residentCharge: inv.residentCharge,
      totalAmount: inv.totalAmount,
      paymentStatus: inv.paymentStatus,
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Generates CSV string for Subscriptions
 */
async function generateSubscriptionsCSV() {
  const subscriptions = await HostelSubscription.find()
    .populate("hostelId", "hostelName ownerName phone")
    .populate("currentPlan", "name monthlyPrice");

  let csv = "Subscription ID,Hostel Name,Owner Name,Phone,Plan,Total Amount,Status,Next Billing Date\n";

  subscriptions.forEach((sub) => {
    const hostelName = `"${sub.hostelId?.hostelName || "Unknown"}"`;
    const ownerName = `"${sub.hostelId?.ownerName || "Unknown"}"`;
    const phone = `"${sub.hostelId?.phone || ""}"`;
    const plan = `"${sub.currentPlan?.name || "Trial"}"`;
    const amount = sub.totalAmount || 0;
    const status = sub.status || "Trial";
    const nextBilling = sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().slice(0, 10) : "";

    csv += `${sub._id},${hostelName},${ownerName},${phone},${plan},${amount},${status},${nextBilling}\n`;
  });

  return csv;
}

module.exports = {
  generateRevenueExcelReport,
  generateSubscriptionsCSV,
};
