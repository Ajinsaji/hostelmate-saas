const treasuryService = require("../services/treasuryService");
const BankAccount = require("../models/BankAccount");
const CashBook = require("../models/CashBook");
const BankTransaction = require("../models/BankTransaction");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createBankAccount = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const account = await treasuryService.createBankAccount(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Bank Account Created", account });
  } catch (err) {
    logger.error("createBankAccount error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create bank account" });
  }
};

const getBankAccounts = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const accounts = await BankAccount.find({ hostelId: userCtx.hostelId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, accounts });
  } catch (err) {
    logger.error("getBankAccounts error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const recordCashBook = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const entry = await treasuryService.recordCashBookEntry(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Cash Book Entry Recorded", entry });
  } catch (err) {
    logger.error("recordCashBook error:", err);
    return res.status(400).json({ success: false, message: err.message || "Cash book entry failed" });
  }
};

const getCashBook = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const entries = await CashBook.find({ hostelId: userCtx.hostelId }).sort({ transactionDate: -1 });
    return res.status(200).json({ success: true, cashBook: entries });
  } catch (err) {
    logger.error("getCashBook error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const recordBankTx = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const tx = await treasuryService.recordBankTransaction(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Bank Transaction Logged & Account Balance Updated", transaction: tx });
  } catch (err) {
    logger.error("recordBankTx error:", err);
    return res.status(400).json({ success: false, message: err.message || "Transaction logging failed" });
  }
};

const reconcileBankTx = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const tx = await treasuryService.reconcileBankTransaction(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Bank Transaction Reconciled", transaction: tx });
  } catch (err) {
    logger.error("reconcileBankTx error:", err);
    return res.status(400).json({ success: false, message: err.message || "Reconciliation failed" });
  }
};

const getTreasurySummary = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const summary = await treasuryService.getTreasurySummary(userCtx.hostelId);
    return res.status(200).json({ success: true, ...summary });
  } catch (err) {
    logger.error("getTreasurySummary error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getLedger = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const timeline = await treasuryService.getTreasuryLedgerTimeline(
      userCtx.hostelId,
      req.query.accountType,
      req.query.accountId
    );
    return res.status(200).json({ success: true, ledger: timeline });
  } catch (err) {
    logger.error("getLedger error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createBankAccount,
  getBankAccounts,
  recordCashBook,
  getCashBook,
  recordBankTx,
  reconcileBankTx,
  getLedger,
  getTreasurySummary,
};

