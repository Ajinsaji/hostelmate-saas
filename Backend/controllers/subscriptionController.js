const { logger } = require("../utils/logger");
const subscriptionService = require("../services/subscriptionService");
const Subscription = require("../models/Subscription");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const SubscriptionHistory = require("../models/SubscriptionHistory");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const Invoice = require("../models/Invoice");
const { calculateResidentBilling } = require("../utils/residentBillingCalculator");

/**
 * GET /api/owner/subscription/dashboard
 * GET /api/owner/subscription-status
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
 * GET /api/owner/subscription/billing-preview
 * Returns live resident count, ₹10 base rate, estimated monthly amount, and prorated calculation
 */
const getBillingPreview = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const { periodStart, periodEnd } = req.query;
    const calculation = await calculateResidentBilling({
      hostelId: owner.hostelId,
      periodStart,
      periodEnd,
      monthlyRate: 10,
    });

    return res.status(200).json({
      success: true,
      calculation,
    });
  } catch (error) {
    logger.error("getBillingPreview error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/owner/subscription/request-continuation
 * Owner submits continuation request
 */
const requestContinuation = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const hostelId = owner.hostelId;
    const ownerId = owner._id;

    // Check for existing pending request
    const existingPending = await SubscriptionRequest.findOne({
      hostelId,
      status: "pending",
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: "A continuation request is already pending approval.",
        request: existingPending,
      });
    }

    const { requestedDays = 30, note, message } = req.body;
    const ownerNote = note || message || "";

    // Compute live billing
    const calculation = await calculateResidentBilling({ hostelId, monthlyRate: 10 });
    const residentCount = calculation.residentCount;
    const calculatedAmount = calculation.fullPeriodCharge || residentCount * 10;

    let sub = await Subscription.findOne({ hostelId });
    if (!sub) {
      sub = await subscriptionService.initializeTrialSubscription(hostelId, ownerId);
    }

    const requestDoc = await SubscriptionRequest.create({
      ownerId,
      hostelId,
      subscriptionId: sub._id,
      requestedDays: Number(requestedDays) || 30,
      residentCount,
      calculatedAmount,
      ownerNote,
      status: "pending",
      paymentStatus: "pending",
      paidAmount: 0,
      requestedAt: new Date(),
    });

    // Update subscription status to continuation_requested
    sub.status = "continuation_requested";
    sub.subscriptionStatus = "continuation_requested";
    await sub.save();

    // Log history
    await SubscriptionHistory.create({
      hostelId,
      ownerId,
      subscriptionId: sub._id,
      action: "CONTINUATION_REQUESTED",
      previousEndDate: sub.endDate || sub.trialEndDate,
      newAmount: calculatedAmount,
      changedBy: owner.ownerName || "Owner",
      reason: ownerNote || "Continuation request submitted by Owner",
    });

    return res.status(201).json({
      success: true,
      message: "Subscription continuation request submitted successfully!",
      request: requestDoc,
    });
  } catch (error) {
    logger.error("requestContinuation error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/requests
 * Get all continuation requests for this owner's hostel
 */
const getOwnerContinuationRequests = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const requests = await SubscriptionRequest.find({ hostelId: owner.hostelId })
      .sort({ createdAt: -1 })
      .populate("approvedBy", "name role");

    return res.status(200).json({
      success: true,
      requests,
    });
  } catch (error) {
    logger.error("getOwnerContinuationRequests error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/owner/subscription/history
 * Get subscription audit history
 */
const getOwnerSubscriptionHistory = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const history = await SubscriptionHistory.find({ hostelId: owner.hostelId }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      history,
    });
  } catch (error) {
    logger.error("getOwnerSubscriptionHistory error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * Legacy support methods
 */
const getAvailablePlans = async (req, res) => {
  return res.status(200).json({
    success: true,
    plans: [
      {
        _id: "unified",
        name: "HostelMate Unified Plan",
        description: "One unified plan with all features included",
        monthlyPrice: 0,
        residentChargePerResident: 10,
      },
    ],
  });
};

const calculateUpgrade = async (req, res) => {
  const calculation = await calculateResidentBilling({ hostelId: req.owner?.hostelId, monthlyRate: 10 });
  return res.status(200).json({ success: true, calculation });
};

const processPayment = async (req, res) => {
  return res.status(200).json({ success: true, message: "Payment processed" });
};

const getOwnerInvoices = async (req, res) => {
  const invoices = await Invoice.find({ hostelId: req.owner?.hostelId }).sort({ createdAt: -1 });
  return res.status(200).json({ success: true, invoices });
};

const getInvoiceById = async (req, res) => {
  const invoice = await Invoice.findOne({ _id: req.params.id, hostelId: req.owner?.hostelId });
  if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
  return res.status(200).json({ success: true, invoice });
};

const streamInvoicePDF = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, hostelId: req.owner?.hostelId });
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found" });
    const { generateInvoicePDF } = require("../services/pdfInvoiceService");
    const filePath = await generateInvoicePDF(invoice._id);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoiceNumber}.pdf"`);
    return res.sendFile(filePath);
  } catch (error) {
    return res.status(500).json({ success: false, message: "PDF generation error" });
  }
};

module.exports = {
  getSubscriptionStatus: getOwnerSubscriptionDashboard,
  getOwnerSubscriptionDashboard,
  getBillingPreview,
  requestContinuation,
  getOwnerContinuationRequests,
  getOwnerSubscriptionHistory,
  getAvailablePlans,
  calculateUpgrade,
  processPayment,
  getOwnerInvoices,
  getInvoiceById,
  streamInvoicePDF,
};
