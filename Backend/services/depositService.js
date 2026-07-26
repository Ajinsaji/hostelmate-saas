const SecurityDeposit = require("../models/SecurityDeposit");
const { recordLedgerEntry } = require("./ledgerService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

/**
 * Receive security deposit from resident
 */
async function receiveDeposit(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  await assertPeriodOpen(hostelId, data.receivedDate || new Date());

  const deposit = await SecurityDeposit.create({

    ...data,
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
  const deposit = await SecurityDeposit.findById(depositId);
  if (!deposit) throw new Error("Security deposit record not found");

  const amt = parseFloat(refundAmount);
  if (isNaN(amt) || amt <= 0) throw new Error("Refund amount must be greater than 0");

  if (amt > deposit.balance) {
    throw new Error(`Refund amount ₹${amt} exceeds active deposit balance ₹${deposit.balance}`);
  }

  deposit.refundedAmount = (deposit.refundedAmount || 0) + amt;
  deposit.refundDate = new Date();
  if (remarks) deposit.remarks = `${deposit.remarks || ""}\n[Refund]: ${remarks}`.trim();
  await deposit.save();

  // Record Ledger DEBIT entry for refund
  await recordLedgerEntry({
    hostelId: deposit.hostelId,
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
