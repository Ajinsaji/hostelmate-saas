const apService = require("../services/accountsPayableService");
const PaymentVoucher = require("../models/PaymentVoucher");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId || req.body?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createVoucher = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const voucher = await apService.createPaymentVoucher(req.body, userCtx);
    return res.status(201).json({ success: true, message: "Payment Voucher Created", voucher });
  } catch (err) {
    logger.error("createVoucher error:", err);
    return res.status(400).json({ success: false, message: err.message || "Voucher creation failed" });
  }
};

const processPayment = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const voucher = await apService.processVoucherPayment(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Payment Processed & Vendor Ledger Updated", voucher });
  } catch (err) {
    logger.error("processPayment error:", err);
    return res.status(400).json({ success: false, message: err.message || "Payment processing failed" });
  }
};

const getVouchers = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const vouchers = await PaymentVoucher.find({ hostelId: userCtx.hostelId })
      .populate("vendorId", "vendorName phone")
      .populate("vendorInvoiceId", "invoiceNumber amount")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, vouchers });
  } catch (err) {
    logger.error("getVouchers error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getStatement = async (req, res) => {
  try {
    const timeline = await apService.getVendorStatementTimeline(req.params.vendorId);
    return res.status(200).json({ success: true, statement: timeline });
  } catch (err) {
    logger.error("getStatement error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const getAgeingReport = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const report = await apService.getAccountsPayableAgeingReport(userCtx.hostelId);
    return res.status(200).json({ success: true, ageingReport: report });
  } catch (err) {
    logger.error("getAgeingReport error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createVoucher,
  processPayment,
  getVouchers,
  getStatement,
  getAgeingReport,
};
