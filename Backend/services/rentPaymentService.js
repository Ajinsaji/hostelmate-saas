const RentPayment = require("../models/RentPayment");
const RentInvoice = require("../models/RentInvoice");
const Resident = require("../models/Resident");
const { recordLedgerEntry } = require("./ledgerService");
const { generatePaymentReceiptPDF } = require("./pdfReceiptService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

async function generatePaymentNumber(hostelId) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await RentPayment.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `PAY-${ym}-${seq}`;
}

/**
 * Record a payment for an invoice or resident advance
 */
async function recordPayment(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!data.residentId) throw new Error("Resident ID is required");

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
  await assertPeriodOpen(hostelId, paymentDate);

  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) throw new Error("Payment amount must be greater than 0");


  const paymentNumber = data.paymentNumber || (await generatePaymentNumber(hostelId));

  let invoice = null;
  if (data.invoiceId) {
    invoice = await RentInvoice.findById(data.invoiceId);
    if (!invoice) throw new Error("Target invoice not found");

    // Update invoice paid amount & balance
    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    await invoice.save(); // pre-save hook updates status and balanceAmount
  }

  const payment = await RentPayment.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    invoiceId: data.invoiceId || null,
    residentId: data.residentId,
    paymentNumber,
    amount,
    paymentMethod: data.paymentMethod || "UPI",
    receivedBy: userContext.userId || null,
    status: "Completed",
  });

  // Record Ledger CREDIT entry for the payment
  await recordLedgerEntry({
    hostelId,
    residentId: data.residentId,
    transactionType: "Payment",
    debit: 0,
    credit: amount,
    referenceId: payment._id,
    remarks: `Payment ${paymentNumber} via ${payment.paymentMethod}${invoice ? ` for Invoice ${invoice.invoiceNumber}` : ""}`,
  });

  // Generate Receipt PDF
  try {
    const pdfPath = await generatePaymentReceiptPDF(payment._id);
    payment.receiptPdfPath = pdfPath;
    await payment.save();
  } catch (pdfErr) {
    logger.error("Error generating receipt PDF:", pdfErr);
  }

  return payment;
}

/**
 * Get Filtered Payments List
 */
async function getPaymentsList({ hostelId, residentId, invoiceId, page = 1, limit = 50 }) {
  const query = { hostelId, status: "Completed" };
  if (residentId) query.residentId = residentId;
  if (invoiceId) query.invoiceId = invoiceId;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    RentPayment.find(query)
      .populate("residentId", "fullName admissionNumber phone")
      .populate("invoiceId", "invoiceNumber grandTotal balanceAmount")
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(limitNum),
    RentPayment.countDocuments(query),
  ]);

  return { payments, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

module.exports = {
  recordPayment,
  getPaymentsList,
};
