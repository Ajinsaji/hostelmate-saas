const SecurityDeposit = require("../models/SecurityDeposit");
const Resident = require("../models/Resident");
const { recordLedgerEntry } = require("./ledgerService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

/**
 * Receive security deposit from resident
 */
async function receiveDeposit(data, userContext = {}) {
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Validate resident belongs to the active hostel
  const resident = await Resident.findOne({ _id: data.residentId, hostelId, isDeleted: false });
  if (!resident) throw new Error("Resident not found in this hostel");

  const depositDate = data.receivedDate ? new Date(data.receivedDate) : new Date();
  await assertPeriodOpen(hostelId, depositDate);

  const safeData = { ...data };
  delete safeData.hostelId;
  delete safeData.tenantId;

  const deposit = await SecurityDeposit.create({
    ...safeData,
    tenantId: hostelId,
    hostelId,
    balance: data.depositAmount,
  });

  // Record Ledger CREDIT entry for deposit
  await recordLedgerEntry({
    hostelId,
    residentId: data.residentId,
    transactionType: "Deposit",
    debit: 0,
    credit: data.depositAmount,
    referenceId: deposit._id,
    remarks: `Security Deposit received: ₹${data.depositAmount}`,
  });

  return deposit;
}

/**
 * Refund security deposit (Supports partial or full refund)
 */
async function refundDeposit({ depositId, refundAmount, deductionAmount = 0, remarks = "" }, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  await assertPeriodOpen(hostelId, new Date());

  const deposit = await SecurityDeposit.findOne({ _id: depositId, hostelId });
  if (!deposit) throw new Error("Security deposit record not found");

  const amt = parseFloat(refundAmount);
  if (isNaN(amt) || amt <= 0) throw new Error("Refund amount must be greater than 0");

  if (amt > deposit.balance) {
    throw new Error(`Refund amount ₹${amt} exceeds active deposit balance ₹${deposit.balance}`);
  }

  deposit.refundedAmount = (deposit.refundedAmount || 0) + amt;
  deposit.balance = Math.max(0, (deposit.depositAmount || 0) - deposit.refundedAmount);
  if (deposit.balance === 0) {
    deposit.status = "Refunded";
  } else {
    deposit.status = "Partially Refunded";
  }
  deposit.refundDate = new Date();
  if (remarks) deposit.remarks = `${deposit.remarks || ""}\n[Refund]: ${remarks}`.trim();

  await deposit.save();

  // Record Ledger DEBIT entry for refund
  await recordLedgerEntry({
    hostelId,
    residentId: deposit.residentId,
    transactionType: "Refund",
    debit: amt,
    credit: 0,
    referenceId: deposit._id,
    remarks: `Security Deposit Refunded: ₹${amt}${deductionAmount > 0 ? ` (Deductions: ₹${deductionAmount})` : ""}`,
  });

  return deposit;
}

async function getDepositsList(hostelId, residentId) {
  const query = { hostelId };
  if (residentId) query.residentId = residentId;

  return await SecurityDeposit.find(query)
    .populate("residentId", "fullName admissionNumber phone")
    .sort({ createdAt: -1 });
}

module.exports = {
  receiveDeposit,
  refundDeposit,
  getDepositsList,
};
