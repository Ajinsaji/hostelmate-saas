const ResidentLedger = require("../models/ResidentLedger");
const { logger } = require("../utils/logger");

/**
 * Appends a transaction to the resident's ledger and updates running balance
 */
async function recordLedgerEntry({ hostelId, residentId, transactionType, debit = 0, credit = 0, referenceId = null, remarks = "", session = null }) {
  try {
    // Get last ledger entry for current balance
    const query = ResidentLedger.findOne({ residentId }).sort({ transactionDate: -1, createdAt: -1 });
    if (session) query.session(session);
    const lastEntry = await query;
    const prevBalance = lastEntry ? lastEntry.balance : 0;

    // Running Balance = Previous Balance + Debit (amount owed) - Credit (amount paid/discounted)
    const newBalance = prevBalance + debit - credit;

    const entryData = {
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
    };

    let entry;
    if (session) {
      const created = await ResidentLedger.create([entryData], { session });
      entry = created[0];
    } else {
      entry = await ResidentLedger.create(entryData);
    }

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
