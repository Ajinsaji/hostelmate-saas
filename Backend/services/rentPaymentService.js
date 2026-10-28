const mongoose = require("mongoose");
const RentPayment = require("../models/RentPayment");
const RentInvoice = require("../models/RentInvoice");
const Resident = require("../models/Resident");
const AuditLog = require("../models/AuditLog");
const { recordLedgerEntry } = require("./ledgerService");
const { generatePaymentReceiptPDF } = require("./pdfReceiptService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

/**
 * Execute multi-document writes within an atomic transaction.
 * FAILS CLOSED: If atomic transactions are unavailable on an active database connection,
 * aborts immediately to prevent inconsistent partial writes across invoices, payments, and ledgers.
 */
async function withTransaction(fn) {
  // If not connected to MongoDB (e.g. isolated in-memory unit tests with mocked models)
  if (mongoose.connection.readyState !== 1) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Financial transaction aborted: MongoDB connection is not active.");
    }
    return await fn(null);
  }

  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (err) {
    logger.error({ err }, "[RentPayment] Financial transaction aborted due to error");
    throw err;
  } finally {
    await session.endSession();
  }
}

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
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");
  if (!data.residentId) throw new Error("Resident ID is required");

  const paymentDate = data.paymentDate ? new Date(data.paymentDate) : new Date();
  await assertPeriodOpen(hostelId, paymentDate);

  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) throw new Error("Payment amount must be greater than 0");

  const resident = await Resident.findOne({ _id: data.residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found in this hostel");

  // Durable Idempotency: Return existing record if client idempotencyKey matches
  if (data.idempotencyKey && typeof data.idempotencyKey === "string" && data.idempotencyKey.trim()) {
    const existingByKey = await RentPayment.findOne({
      hostelId,
      idempotencyKey: data.idempotencyKey.trim(),
    });
    if (existingByKey) {
      logger.info(`[RentPayment] Durable idempotency hit for key ${data.idempotencyKey}`);
      return existingByKey;
    }
  } else {
    // 10-second lookup heuristic as fallback when client did not provide idempotencyKey
    const tenSecondsAgo = new Date(Date.now() - 10000);
    const existingRecent = await RentPayment.findOne({
      hostelId,
      residentId: data.residentId,
      amount,
      createdAt: { $gte: tenSecondsAgo },
      ...(data.invoiceId ? { invoiceId: data.invoiceId } : {}),
      ...(data.transactionReference ? { transactionReference: data.transactionReference } : {}),
    });
    if (existingRecent) {
      logger.info(`[RentPayment] 10-second idempotency hit for recent duplicate payment`);
      return existingRecent;
    }
  }

  // Pre-validate target invoice if provided
  let targetInvoice = null;
  if (data.invoiceId) {
    targetInvoice = await RentInvoice.findOne({ _id: data.invoiceId, hostelId, isDeleted: false });
    if (!targetInvoice) throw new Error("Target invoice not found in this hostel");
    if (String(targetInvoice.residentId) !== String(data.residentId)) {
      throw new Error("Invoice does not belong to the selected resident");
    }
    if (targetInvoice.paymentStatus === "Paid" || targetInvoice.balanceAmount <= 0) {
      throw new Error("Invoice is already fully paid");
    }
    if (amount > targetInvoice.balanceAmount) {
      throw new Error(`Payment amount (₹${amount}) exceeds invoice outstanding balance (₹${targetInvoice.balanceAmount})`);
    }
  }

  const paymentNumber = data.paymentNumber || (await generatePaymentNumber(hostelId));

  // Multi-document transactional write for financial consistency
  let payment;
  try {
    payment = await withTransaction(async (session) => {
      let invoiceToUpdate = null;
      if (data.invoiceId) {
        const q = RentInvoice.findOne({ _id: data.invoiceId, hostelId, isDeleted: false });
        if (session) q.session(session);
        invoiceToUpdate = await q;
        if (!invoiceToUpdate) throw new Error("Target invoice not found during transaction");

        if (invoiceToUpdate.paymentStatus === "Paid" || invoiceToUpdate.balanceAmount <= 0) {
          throw new Error("Invoice is already fully paid");
        }
        if (amount > invoiceToUpdate.balanceAmount) {
          throw new Error(`Payment amount (₹${amount}) exceeds invoice outstanding balance (₹${invoiceToUpdate.balanceAmount})`);
        }

        invoiceToUpdate.paidAmount = (invoiceToUpdate.paidAmount || 0) + amount;
        await invoiceToUpdate.save({ session });
      }

      const paymentDocData = {
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
        idempotencyKey: data.idempotencyKey && typeof data.idempotencyKey === "string" ? data.idempotencyKey.trim() : null,
      };

      let createdPayment;
      if (session) {
        const created = await RentPayment.create([paymentDocData], { session });
        createdPayment = created[0];
      } else {
        createdPayment = await RentPayment.create(paymentDocData);
      }

      // Record Ledger CREDIT entry
      await recordLedgerEntry({
        hostelId,
        residentId: data.residentId,
        transactionType: "Payment",
        debit: 0,
        credit: amount,
        referenceId: createdPayment._id,
        remarks: `Payment ${paymentNumber} via ${createdPayment.paymentMethod}${invoiceToUpdate ? ` for Invoice ${invoiceToUpdate.invoiceNumber}` : ""}`,
        session,
      });

      // Audit Log entry
      const auditData = {
        hostelId,
        userId: userContext.userId || null,
        action: `Recorded Rent Payment ${paymentNumber} (₹${amount}) for resident ${resident.fullName || resident.name}`,
        actionType: "CREATE",
        entity: "RentPayment",
        targetId: createdPayment._id,
        targetModel: "RentPayment",
        details: { paymentNumber, amount, paymentMethod: createdPayment.paymentMethod, invoiceId: data.invoiceId || null },
        ipAddress: userContext.ip || "",
        timestamp: new Date(),
      };
      if (session) {
        await AuditLog.create([auditData], { session });
      } else {
        await AuditLog.create(auditData);
      }

      return createdPayment;
    });
  } catch (err) {
    // If a concurrent request created the payment with the same idempotencyKey, return that existing payment
    if (data.idempotencyKey && (err.code === 11000 || err.message?.includes("idempotencyKey") || err.message?.includes("E11000"))) {
      const existing = await RentPayment.findOne({
        hostelId,
        idempotencyKey: data.idempotencyKey.trim(),
      });
      if (existing) {
        logger.info(`[RentPayment] Concurrent idempotency duplicate caught; returned existing record`);
        return existing;
      }
    }
    throw err;
  }

  // Post-transaction receipt PDF generation (failure does not rollback financial write or retry-duplicate)
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
 * Reverse an existing Rent Payment (Audited, non-destructive credit/debit reversal)
 */
async function reversePayment(paymentId, { reason }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required for payment reversal");
  if (!reason || reason.trim().length < 3) throw new Error("A valid reversal reason of at least 3 characters is required");

  const payment = await RentPayment.findOne({ _id: paymentId, hostelId });
  if (!payment) throw new Error("Payment record not found in active hostel");

  if (payment.status === "Reversed") {
    throw new Error("Payment has already been reversed");
  }
  if (payment.status !== "Completed") {
    throw new Error(`Cannot reverse payment with status '${payment.status}'`);
  }

  await assertPeriodOpen(hostelId, new Date());

  const reversedPayment = await withTransaction(async (session) => {
    const payQuery = RentPayment.findOne({ _id: paymentId, hostelId });
    if (session) payQuery.session(session);
    const targetPayment = await payQuery;
    if (!targetPayment) throw new Error("Payment record not found in active hostel");
    if (targetPayment.status === "Reversed") {
      throw new Error("Payment has already been reversed");
    }
    if (targetPayment.status !== "Completed") {
      throw new Error(`Cannot reverse payment with status '${targetPayment.status}'`);
    }

    targetPayment.status = "Reversed";
    targetPayment.reversalReason = reason.trim();
    targetPayment.reversedAt = new Date();
    targetPayment.reversedBy = userContext.userId || null;
    await targetPayment.save({ session });

    // Restore invoice balance if payment was linked to an invoice
    if (targetPayment.invoiceId) {
      const invQuery = RentInvoice.findOne({ _id: targetPayment.invoiceId, hostelId, isDeleted: false });
      if (session) invQuery.session(session);
      const invoice = await invQuery;
      if (invoice) {
        invoice.paidAmount = Math.max(0, (invoice.paidAmount || 0) - targetPayment.amount);
        await invoice.save({ session });
      }
    }

    // Record offsetting DEBIT on resident ledger
    await recordLedgerEntry({
      hostelId,
      residentId: targetPayment.residentId,
      transactionType: "Adjustment",
      debit: targetPayment.amount,
      credit: 0,
      referenceId: targetPayment._id,
      remarks: `Reversal of Payment ${targetPayment.paymentNumber}: ${reason.trim()}`,
      session,
    });

    // Record AuditLog
    const auditData = {
      hostelId,
      userId: userContext.userId || null,
      action: `Reversed Rent Payment ${targetPayment.paymentNumber} (₹${targetPayment.amount}). Reason: ${reason.trim()}`,
      actionType: "REVERSAL",
      entity: "RentPayment",
      targetId: targetPayment._id,
      targetModel: "RentPayment",
      details: { paymentNumber: targetPayment.paymentNumber, amount: targetPayment.amount, reason: reason.trim() },
      ipAddress: userContext.ip || "",
      timestamp: new Date(),
    };
    if (session) {
      await AuditLog.create([auditData], { session });
    } else {
      await AuditLog.create(auditData);
    }

    return targetPayment;
  });

  return reversedPayment;
}

/**
 * Get Filtered Payments List
 */
async function getPaymentsList({ hostelId, residentId, invoiceId, status, page = 1, limit = 50 }) {
  const query = { hostelId };
  if (status && status !== "ALL") {
    query.status = status;
  } else if (!status) {
    // Default to Completed & Reversed so UI sees historical activity
    query.status = { $in: ["Completed", "Reversed"] };
  }
  if (residentId) query.residentId = residentId;
  if (invoiceId) query.invoiceId = invoiceId;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [payments, total] = await Promise.all([
    RentPayment.find(query)
      .populate("residentId", "fullName admissionNumber phone name roomId")
      .populate("invoiceId", "invoiceNumber grandTotal balanceAmount billingPeriod paymentStatus")
      .sort({ paymentDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    RentPayment.countDocuments(query),
  ]);

  return { payments, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

module.exports = {
  recordPayment,
  reversePayment,
  getPaymentsList,
};
