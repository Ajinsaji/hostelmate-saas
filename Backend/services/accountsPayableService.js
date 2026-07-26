const PaymentVoucher = require("../models/PaymentVoucher");
const VendorStatement = require("../models/VendorStatement");
const VendorInvoice = require("../models/VendorInvoice");
const Vendor = require("../models/Vendor");
const { logger } = require("../utils/logger");

async function generateVoucherNumber(hostelId) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await PaymentVoucher.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `PV-${ym}-${seq}`;
}

async function createPaymentVoucher(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const invoice = await VendorInvoice.findById(data.vendorInvoiceId);
  if (!invoice) throw new Error("Vendor Invoice not found");

  const voucherNumber = await generateVoucherNumber(hostelId);

  const voucher = await PaymentVoucher.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    voucherNumber,
    vendorId: invoice.vendorId,
    amount: data.amount || invoice.amount,
    status: "Approved",
    approvedBy: userContext.userId || null,
  });

  return voucher;
}

async function processVoucherPayment(voucherId, userContext = {}) {
  const voucher = await PaymentVoucher.findById(voucherId);
  if (!voucher) throw new Error("Payment Voucher not found");
  if (voucher.status === "Paid") throw new Error("Voucher has already been paid");

  voucher.status = "Paid";
  voucher.paidBy = userContext.userId || null;
  voucher.paymentDate = new Date();
  await voucher.save();

  // 1. Mark Vendor Invoice as Paid
  const invoice = await VendorInvoice.findById(voucher.vendorInvoiceId);
  if (invoice) {
    invoice.status = "Paid";
    await invoice.save();
  }

  // 2. Record Debit entry in Vendor Statement
  const lastEntry = await VendorStatement.findOne({ hostelId: voucher.hostelId, vendorId: voucher.vendorId }).sort({ transactionDate: -1, createdAt: -1 });
  const prevBalance = lastEntry ? lastEntry.runningBalance : 0;
  const runningBalance = prevBalance - voucher.amount;

  await VendorStatement.create({
    tenantId: voucher.hostelId,
    hostelId: voucher.hostelId,
    vendorId: voucher.vendorId,
    transactionDate: new Date(),
    transactionType: "Payment",
    referenceId: voucher._id,
    referenceNumber: voucher.voucherNumber,
    debit: voucher.amount,
    credit: 0,
    runningBalance,
    remarks: `Payment Voucher ${voucher.voucherNumber} (Ref: ${voucher.referenceNumber || "N/A"})`,
  });

  // 3. Update Vendor metrics
  const vendor = await Vendor.findById(voucher.vendorId);
  if (vendor) {
    vendor.totalSpent = (vendor.totalSpent || 0) + voucher.amount;
    if (typeof vendor.pendingBills === "number" && vendor.pendingBills > 0) {
      vendor.pendingBills -= 1;
    }
    await vendor.save();
  }

  return voucher;
}

async function getVendorStatementTimeline(vendorId) {
  return await VendorStatement.find({ vendorId }).sort({ transactionDate: -1 });
}

async function getAccountsPayableAgeingReport(hostelId) {
  const now = new Date();
  const unpaidInvoices = await VendorInvoice.find({
    hostelId,
    status: { $in: ["Pending", "Matched", "Mismatch", "Approved"] },
  }).populate("vendorId", "vendorName phone");

  const report = {
    current: 0,      // < 30 days
    days30to60: 0,   // 30 - 60 days
    days60to90: 0,   // 60 - 90 days
    over90days: 0,   // > 90 days
    totalOutstanding: 0,
    invoices: [],
  };

  unpaidInvoices.forEach((inv) => {
    const ageDays = Math.floor((now - new Date(inv.invoiceDate)) / (1000 * 60 * 60 * 24));
    const amount = inv.amount || 0;
    report.totalOutstanding += amount;

    let bucket = "Current (<30 days)";
    if (ageDays <= 30) {
      report.current += amount;
    } else if (ageDays <= 60) {
      report.days30to60 += amount;
      bucket = "30-60 Days";
    } else if (ageDays <= 90) {
      report.days60to90 += amount;
      bucket = "60-90 Days";
    } else {
      report.over90days += amount;
      bucket = "Over 90 Days";
    }

    report.invoices.push({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      vendorName: inv.vendorId?.vendorName || "Unknown",
      invoiceDate: inv.invoiceDate,
      amount,
      ageDays,
      bucket,
      status: inv.status,
    });
  });

  return report;
}

module.exports = {
  createPaymentVoucher,
  processVoucherPayment,
  getVendorStatementTimeline,
  getAccountsPayableAgeingReport,
};
