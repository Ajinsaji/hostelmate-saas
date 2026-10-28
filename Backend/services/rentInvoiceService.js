const mongoose = require("mongoose");
const RentInvoice = require("../models/RentInvoice");
const Resident = require("../models/Resident");
const { recordLedgerEntry } = require("./ledgerService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

/**
 * Execute multi-document writes within an atomic transaction.
 * Fails closed if connection is not ready in production.
 */
async function withTransaction(fn) {
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
    logger.error({ err }, "[RentInvoice] Financial transaction aborted due to error");
    throw err;
  } finally {
    await session.endSession();
  }
}

async function generateInvoiceNumber(hostelId) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await RentInvoice.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `RINV-${ym}-${seq}`;
}

/**
 * Safely calculates the due date avoiding calendar rollover (e.g. day 31 in 30-day months)
 */
function calculateSafeDueDate(issueDate, targetDay) {
  const day = Math.min(Math.max(parseInt(targetDay, 10) || 5, 1), 31);
  let year = issueDate.getFullYear();
  let month = issueDate.getMonth();

  // Find max days in current issue month
  const maxDaysCurrentMonth = new Date(year, month + 1, 0).getDate();
  let candidateDate = new Date(year, month, Math.min(day, maxDaysCurrentMonth));

  if (candidateDate <= issueDate) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
    const maxDaysNextMonth = new Date(year, month + 1, 0).getDate();
    candidateDate = new Date(year, month, Math.min(day, maxDaysNextMonth));
  }
  return candidateDate;
}

/**
 * Creates a single Rent Invoice and logs a DEBIT entry to the resident's ledger atomically
 */
async function createRentInvoice(data, userContext = {}) {
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
  await assertPeriodOpen(hostelId, issueDate);

  const resident = await Resident.findOne({ _id: data.residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found in this hostel");

  const now = new Date();
  const currentMonthYear = now.toLocaleString("default", { month: "long", year: "numeric" });
  const billingPeriod = data.billingPeriod || currentMonthYear;

  const existing = await RentInvoice.findOne({
    hostelId,
    residentId: resident._id,
    billingPeriod,
    isDeleted: false,
  });
  if (existing) {
    throw new Error(`An active rent invoice already exists for ${resident.fullName || resident.name || "this resident"} for ${billingPeriod}`);
  }

  const invoiceNumber = data.invoiceNumber || (await generateInvoiceNumber(hostelId));

  // Calculate safe due date
  const dueDate = data.dueDate ? new Date(data.dueDate) : calculateSafeDueDate(issueDate, resident.paymentDay || 5);

  const invoiceDocData = {
    ...data,
    tenantId: hostelId,
    hostelId,
    residentId: resident._id,
    roomId: resident.roomId || null,
    bedId: resident.bedId || null,
    invoiceNumber,
    billingPeriod,
    issueDate,
    dueDate,
    rentAmount: data.rentAmount !== undefined ? data.rentAmount : (resident.monthlyRent || 0),
    generatedBy: userContext.userId || null,
  };

  // Atomic transactional creation of invoice and ledger DEBIT
  const invoice = await withTransaction(async (session) => {
    let createdInvoice;
    if (session) {
      const created = await RentInvoice.create([invoiceDocData], { session });
      createdInvoice = created[0];
    } else {
      createdInvoice = await RentInvoice.create(invoiceDocData);
    }

    // Record Ledger DEBIT entry for the invoice amount
    await recordLedgerEntry({
      hostelId,
      residentId: resident._id,
      transactionType: "Rent",
      debit: createdInvoice.grandTotal,
      credit: 0,
      referenceId: createdInvoice._id,
      remarks: `Rent Invoice ${createdInvoice.invoiceNumber} for ${billingPeriod}`,
      session,
    });

    return createdInvoice;
  });

  return invoice;
}

/**
 * Batch Monthly Invoice Generator for all Active and Notice-Period residents in a hostel
 */
async function generateMonthlyInvoices(hostelId, userContext = {}) {
  if (!hostelId) throw new Error("Hostel ID is required for batch invoice generation");

  const now = new Date();
  await assertPeriodOpen(hostelId, now);

  const activeResidents = await Resident.find({
    hostelId,
    status: { $in: ["Active", "active", "Notice Period"] },
    isDeleted: false,
  });

  const currentMonthYear = now.toLocaleString("default", { month: "long", year: "numeric" });

  let generatedCount = 0;
  let skippedCount = 0;
  const createdInvoices = [];
  const errors = [];

  for (const res of activeResidents) {
    const existing = await RentInvoice.findOne({
      hostelId,
      residentId: res._id,
      billingPeriod: currentMonthYear,
      isDeleted: false,
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    try {
      const inv = await createRentInvoice(
        {
          hostelId,
          residentId: res._id,
          billingPeriod: currentMonthYear,
          rentAmount: res.monthlyRent || 0,
        },
        userContext
      );
      createdInvoices.push(inv);
      generatedCount++;
    } catch (err) {
      logger.error({ err, residentId: res._id }, "[RentInvoice] Failed to generate invoice for resident");
      errors.push({ residentId: res._id, name: res.fullName || res.name, error: err.message });
    }
  }

  return { generatedCount, skippedCount, createdInvoices, errors };
}

/**
 * Get Filtered Invoices List
 */
async function getInvoicesList({ hostelId, residentId, status, page = 1, limit = 50 }) {
  const query = { hostelId, isDeleted: false };
  if (residentId) query.residentId = residentId;
  if (status) query.paymentStatus = status;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [invoices, total] = await Promise.all([
    RentInvoice.find(query)
      .populate("residentId", "fullName admissionNumber phone")
      .populate("roomId", "roomNumber")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    RentInvoice.countDocuments(query),
  ]);

  return { invoices, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

module.exports = {
  createRentInvoice,
  generateMonthlyInvoices,
  getInvoicesList,
  calculateSafeDueDate,
};
