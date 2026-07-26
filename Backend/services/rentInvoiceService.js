const RentInvoice = require("../models/RentInvoice");
const Resident = require("../models/Resident");
const { recordLedgerEntry } = require("./ledgerService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

async function generateInvoiceNumber(hostelId) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await RentInvoice.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `RINV-${ym}-${seq}`;
}

/**
 * Creates a single Rent Invoice and logs a DEBIT entry to the resident's ledger
 */
async function createRentInvoice(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const issueDate = data.issueDate ? new Date(data.issueDate) : new Date();
  await assertPeriodOpen(hostelId, issueDate);

  const resident = await Resident.findById(data.residentId);
  if (!resident) throw new Error("Resident not found");


  const invoiceNumber = data.invoiceNumber || (await generateInvoiceNumber(hostelId));


  // Due Date default = 5th of current/next month if not specified
  let dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (!dueDate) {
    dueDate = new Date(issueDate);
    dueDate.setDate(resident.paymentDay || 5);
    if (dueDate <= issueDate) dueDate.setMonth(dueDate.getMonth() + 1);
  }

  const now = new Date();
  const currentMonthYear = now.toLocaleString("default", { month: "long", year: "numeric" });
  const billingPeriod = data.billingPeriod || currentMonthYear;

  const invoice = await RentInvoice.create({
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
    rentAmount: data.rentAmount !== undefined ? data.rentAmount : resident.monthlyRent,
    generatedBy: userContext.userId || null,
  });

  // Record Ledger DEBIT entry for the invoice amount
  await recordLedgerEntry({
    hostelId,
    residentId: resident._id,
    transactionType: "Rent",
    debit: invoice.grandTotal,
    credit: 0,
    referenceId: invoice._id,
    remarks: `Rent Invoice ${invoice.invoiceNumber} for ${billingPeriod}`,
  });

  return invoice;
}

/**
 * Batch Monthly Invoice Generator for all Active residents in a hostel
 */
async function generateMonthlyInvoices(hostelId, userContext = {}) {
  const activeResidents = await Resident.find({
    hostelId,
    status: { $in: ["Active", "active"] },
    isDeleted: false,
  });

  const now = new Date();
  const currentMonthYear = now.toLocaleString("default", { month: "long", year: "numeric" });

  let generatedCount = 0;
  const createdInvoices = [];

  for (const res of activeResidents) {
    // Check if invoice already exists for this resident and billing period
    const existing = await RentInvoice.findOne({
      hostelId,
      residentId: res._id,
      billingPeriod: currentMonthYear,
      isDeleted: false,
    });

    if (!existing) {
      const inv = await createRentInvoice(
        {
          hostelId,
          residentId: res._id,
          billingPeriod: currentMonthYear,
          rentAmount: res.monthlyRent,
        },
        userContext
      );
      createdInvoices.push(inv);
      generatedCount++;
    }
  }

  return { generatedCount, createdInvoices };
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
};
