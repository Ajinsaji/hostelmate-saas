const { logger } = require("../utils/logger");
const subscriptionService = require("../services/subscriptionService");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Invoice = require("../models/Invoice");
const { paymentSchema, upgradeCalcSchema } = require("../validations/subscriptionValidation");

/**
 * GET /api/owner/subscription/dashboard
 * Returns current plan, trial remaining days, subscription status, billing breakdown, renewal state, permissions, invoices history
 */
const getOwnerSubscriptionDashboard = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const details = await subscriptionService.getOwnerSubscriptionDetails(owner.hostelId);
    return res.status(200).json({
      success: true,
      ...details,
    });
  } catch (error) {
    logger.error("getOwnerSubscriptionDashboard error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/plans
 * Gets all active subscription plans for upgrade selection
 */
const getAvailablePlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .populate("features")
      .sort({ monthlyPrice: 1 });
    return res.status(200).json({ success: true, plans });
  } catch (error) {
    logger.error("getAvailablePlans error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/owner/subscription/calculate-upgrade
 * Calculates remaining balance for upgrade (Pays only difference)
 */
const calculateUpgrade = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const { error, value } = upgradeCalcSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const calculation = await subscriptionService.calculateUpgrade(owner.hostelId, value.planId);
    return res.status(200).json({ success: true, calculation });
  } catch (error) {
    logger.error("calculateUpgrade error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/owner/subscription/pay
 * Process plan subscription payment / upgrade payment
 */
const processPayment = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const { error, value } = paymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await subscriptionService.processPaymentAndRenewal(
      owner.hostelId,
      value.planId,
      value.paymentMethod,
      value.transactionId
    );

    return res.status(200).json({
      success: true,
      message: "Subscription payment successful!",
      invoice: result.invoice,
      subscription: result.subscription,
    });
  } catch (error) {
    logger.error("processPayment error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/invoices
 * Gets billing history & invoices
 */
const getOwnerInvoices = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const invoices = await Invoice.find({ hostelId: owner.hostelId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    logger.error("getOwnerInvoices error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/invoices/:id
 * Get single invoice detail by ID
 */
const getInvoiceById = async (req, res) => {
  try {
    const owner = req.owner;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, hostelId: owner.hostelId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    logger.error("getInvoiceById error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/invoices/:id/pdf
 * Streams stored PDF invoice to client
 */
const streamInvoicePDF = async (req, res) => {
  try {
    const owner = req.owner;
    const { id } = req.params;

    const invoice = await Invoice.findOne({ _id: id, hostelId: owner.hostelId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const { generateInvoicePDF } = require("../services/pdfInvoiceService");
    const filePath = await generateInvoicePDF(invoice._id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    logger.error("streamInvoicePDF error:", error);
    return res.status(500).json({ success: false, message: error.message || "PDF generation error" });
  }
};

module.exports = {
  getSubscriptionStatus: getOwnerSubscriptionDashboard,
  getOwnerSubscriptionDashboard,
  getAvailablePlans,
  calculateUpgrade,
  processPayment,
  getOwnerInvoices,
  getInvoiceById,
  streamInvoicePDF,
};

