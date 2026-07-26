const ResidentLedger = require("../models/ResidentLedger");
const { logger } = require("../utils/logger");

/**
 * Appends a transaction to the resident's ledger and updates running balance
 */
async function recordLedgerEntry({ hostelId, residentId, transactionType, debit = 0, credit = 0, referenceId = null, remarks = "" }) {
  try {
    // Get last ledger entry for current balance
    const lastEntry = await ResidentLedger.findOne({ residentId }).sort({ transactionDate: -1, createdAt: -1 });
    const prevBalance = lastEntry ? lastEntry.balance : 0;

    // Running Balance = Previous Balance + Debit (amount owed) - Credit (amount paid/discounted)
    const newBalance = prevBalance + debit - credit;

    const entry = await ResidentLedger.create({
      tenantId: hostelId,
      hostelId,
      residentId,
      transactionDate: new Date(),
      transactionType,
      referenceId,
      debit,
      credit,
      balance: newBalance,
      remarks,
    });

    return entry;
  } catch (err) {
    logger.error("Error recording ledger entry:", err);
    throw err;
  }
}

/**
 * Get resident financial ledger timeline
 */
async function getResidentLedger(residentId) {
  return await ResidentLedger.find({ residentId }).sort({ transactionDate: 1, createdAt: 1 });
}

module.exports = {
  recordLedgerEntry,
  getResidentLedger,
};
