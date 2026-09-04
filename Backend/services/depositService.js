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
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const deposit = await SecurityDeposit.findOne({ _id: depositId, hostelId });
  if (!deposit) throw new Error("Security deposit record not found");

  const amt = parseFloat(refundAmount);
  if (isNaN(amt) || amt <= 0) throw new Error("Refund amount must be greater than 0");

  if (amt > deposit.balance) {
    throw new Error(`Refund amount ₹${amt} exceeds active deposit balance ₹${deposit.balance}`);
  }

  const newRefunded = (deposit.refundedAmount || 0) + amt;
  let newRemarks = deposit.remarks || "";
  if (remarks) newRemarks = `${newRemarks}\n[Refund]: ${remarks}`.trim();

  const updatedDeposit = await SecurityDeposit.findOneAndUpdate(
    { _id: depositId, hostelId },
    {
      $set: {
        refundedAmount: newRefunded,
        refundDate: new Date(),
        remarks: newRemarks,
      }
    },
    { returnDocument: "after" }
  );
  if (!updatedDeposit) throw new Error("Security deposit record not found");

  // Record Ledger DEBIT entry for refund
  await recordLedgerEntry({
    hostelId,
    residentId: deposit.residentId,
    transactionType: "Refund",
    debit: amt,
    credit: 0,
    referenceId: updatedDeposit._id,
    remarks: `Security Deposit Refunded: ₹${amt}${deductionAmount > 0 ? ` (Deductions: ₹${deductionAmount})` : ""}`,
  });

  return updatedDeposit;
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
