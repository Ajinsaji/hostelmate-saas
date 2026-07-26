const BankAccount = require("../models/BankAccount");
const CashBook = require("../models/CashBook");
const BankTransaction = require("../models/BankTransaction");
const TreasuryLedger = require("../models/TreasuryLedger");
const { logger } = require("../utils/logger");

async function createBankAccount(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const account = await BankAccount.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    currentBalance: data.openingBalance || 0,
  });

  if (data.openingBalance > 0) {
    await TreasuryLedger.create({
      tenantId: hostelId,
      hostelId,
      accountType: "Bank",
      accountId: account._id,
      transactionType: "Opening Balance",
      debit: data.openingBalance,
      runningBalance: data.openingBalance,
      createdBy: userContext.userId || null,
      remarks: `Opening Balance for ${account.bankName} (${account.accountNumber})`,
    });
  }

  return account;
}

async function recordCashBookEntry(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const lastEntry = await CashBook.findOne({ hostelId }).sort({ transactionDate: -1, createdAt: -1 });
  const prevBalance = lastEntry ? lastEntry.balance : 0;

  const debit = data.debit || 0;
  const credit = data.credit || 0;
  const balance = prevBalance + debit - credit;

  const entry = await CashBook.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    debit,
    credit,
    balance,
  });

  // Append to Immutable Treasury Ledger
  await TreasuryLedger.create({
    tenantId: hostelId,
    hostelId,
    accountType: "Cash",
    transactionType: data.transactionType || (debit > 0 ? "Receipt" : "Payment"),
    referenceType: data.referenceType || "CashBook",
    referenceId: entry._id,
    debit,
    credit,
    runningBalance: balance,
    createdBy: userContext.userId || null,
    remarks: data.remarks || "Cash Book Entry",
  });

  return entry;
}

async function recordBankTransaction(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const account = await BankAccount.findById(data.bankAccountId);
  if (!account) throw new Error("Bank Account not found");

  const tx = await BankTransaction.create({
    ...data,
    tenantId: hostelId,
    hostelId,
  });

  // Compute immutable running ledger balance
  const lastLedger = await TreasuryLedger.findOne({ hostelId, accountType: "Bank", accountId: account._id }).sort({ transactionDate: -1, createdAt: -1 });
  const prevLedgerBalance = lastLedger ? lastLedger.runningBalance : account.openingBalance || 0;

  const debit = data.transactionType === "Deposit" ? data.amount : 0;
  const credit = data.transactionType === "Withdrawal" ? data.amount : 0;
  const newRunningBalance = prevLedgerBalance + debit - credit;

  // Append to Immutable Treasury Ledger
  await TreasuryLedger.create({
    tenantId: hostelId,
    hostelId,
    accountType: "Bank",
    accountId: account._id,
    transactionType: data.transactionType === "Deposit" ? "Receipt" : "Payment",
    referenceType: "BankTransaction",
    referenceId: tx._id,
    debit,
    credit,
    runningBalance: newRunningBalance,
    createdBy: userContext.userId || null,
    remarks: data.remarks || `Bank ${data.transactionType} (Ref: ${data.referenceNumber || "N/A"})`,
  });

  // Sync cached balance for high-performance reads
  account.currentBalance = newRunningBalance;
  await account.save();

  return tx;
}

async function reconcileBankTransaction(transactionId, userContext = {}) {
  const tx = await BankTransaction.findById(transactionId);
  if (!tx) throw new Error("Bank Transaction not found");

  tx.status = "Reconciled";
  tx.reconciledDate = new Date();
  await tx.save();

  return tx;
}

async function getTreasuryLedgerTimeline(hostelId, accountType, accountId) {
  const query = { hostelId };
  if (accountType) query.accountType = accountType;
  if (accountId) query.accountId = accountId;

  return await TreasuryLedger.find(query)
    .populate("accountId", "bankName accountNumber")
    .sort({ transactionDate: -1, createdAt: -1 });
}

async function getTreasurySummary(hostelId) {
  const accounts = await BankAccount.find({ hostelId, status: "Active" });
  const totalBankLiquidity = accounts.reduce((sum, acc) => sum + (acc.currentBalance || 0), 0);

  const lastCash = await CashBook.findOne({ hostelId }).sort({ transactionDate: -1, createdAt: -1 });
  const cashBalance = lastCash ? lastCash.balance : 0;

  const pendingReconciliations = await BankTransaction.countDocuments({ hostelId, status: "Pending" });

  return {
    totalBankLiquidity,
    cashBalance,
    totalLiquidity: totalBankLiquidity + cashBalance,
    activeAccountsCount: accounts.length,
    pendingReconciliations,
    accounts,
  };
}

module.exports = {
  createBankAccount,
  recordCashBookEntry,
  recordBankTransaction,
  reconcileBankTransaction,
  getTreasuryLedgerTimeline,
  getTreasurySummary,
};

