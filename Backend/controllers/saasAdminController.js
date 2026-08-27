const Subscription = require("../models/Subscription");
const HostelSubscription = require("../models/HostelSubscription");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const SubscriptionHistory = require("../models/SubscriptionHistory");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const SubscriptionFeature = require("../models/SubscriptionFeature");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const BillingSettings = require("../models/BillingSettings");
const ReminderLog = require("../models/ReminderLog");
const AuditLog = require("../models/AuditLog");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Resident = require("../models/Resident");
const subscriptionService = require("../services/subscriptionService");
const { calculateResidentBilling } = require("../utils/residentBillingCalculator");
const getSubscriptionStatus = require("../utils/getSubscriptionStatus");
const { logger } = require("../utils/logger");

/**
 * GET /api/admin/subscriptions/dashboard
 */
const getSuperAdminDashboard = async (req, res) => {
  try {
    const analytics = await subscriptionService.getSuperAdminAnalytics();
    return res.status(200).json({ success: true, analytics });
  } catch (error) {
    logger.error("getSuperAdminDashboard error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/requests
 * Lists all Owner continuation requests with filters and search
 */
const listSubscriptionRequests = async (req, res) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "all" && status !== "All") {
      filter.status = status.toLowerCase();
    }

    let requests = await SubscriptionRequest.find(filter)
      .populate("hostelId", "hostelName name phone address city state")
      .populate("ownerId", "ownerName phone email")
      .populate("approvedBy", "name role username")
      .sort({ createdAt: -1 });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      requests = requests.filter((r) => {
        const hName = (r.hostelId?.hostelName || r.hostelId?.name || "").toLowerCase();
        const oName = (r.ownerId?.ownerName || "").toLowerCase();
        const phone = (r.ownerId?.phone || r.hostelId?.phone || "").toLowerCase();
        return hName.includes(q) || oName.includes(q) || phone.includes(q);
      });
    }

    return res.status(200).json({ success: true, requests });
  } catch (error) {
    logger.error("listSubscriptionRequests error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/requests/:id/approve
 * Admin approves continuation request with chosen extension days, approved amount, payment recording
 */
const approveSubscriptionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      extensionDays = 30,
      approvedAmount,
      paymentStatus = "Paid",
      paidAmount,
      adminNote = "",
      paymentMethod = "Manual",
      transactionId = null,
    } = req.body;

    const requestDoc = await SubscriptionRequest.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: "Subscription request not found" });
    }

    if (requestDoc.status === "approved") {
      return res.status(400).json({ success: false, message: "Request has already been approved" });
    }

    const adminUser = req.user || req.admin || {};
    const adminId = adminUser._id || adminUser.userId;
    const days = Number(extensionDays) || 30;

    let sub = await Subscription.findOne({ hostelId: requestDoc.hostelId });
    if (!sub) {
      sub = await subscriptionService.initializeTrialSubscription(requestDoc.hostelId, requestDoc.ownerId);
    }

    const now = new Date();
    const prevStartDate = sub.startDate || sub.trialStartDate;
    const prevEndDate = sub.endDate || sub.trialEndDate || sub.subscriptionEndDate || now;

    // Calculate new start and end dates
    const isCurrentlyExpired = new Date(prevEndDate).getTime() < now.getTime();
    const newStartDate = isCurrentlyExpired ? now : (sub.startDate || now);
    const baseEnd = isCurrentlyExpired ? now : new Date(prevEndDate);
    const newEndDate = new Date(baseEnd.getTime() + days * 24 * 60 * 60 * 1000);

    const finalAmount = approvedAmount !== undefined ? Number(approvedAmount) : (requestDoc.calculatedAmount || 0);
    const isPaid = paymentStatus === "Paid" || paymentStatus === "paid";
    const finalPaidAmount = paidAmount !== undefined ? Number(paidAmount) : (isPaid ? finalAmount : 0);

    // Update Subscription
    sub.status = "Active";
    sub.subscriptionStatus = "active";
    sub.isTrial = false;
    sub.startDate = newStartDate;
    sub.endDate = newEndDate;
    sub.subscriptionStartDate = newStartDate;
    sub.subscriptionEndDate = newEndDate;
    sub.extensionDays = (sub.extensionDays || 0) + days;
    sub.amount = finalAmount;
    sub.paidAmount = finalPaidAmount;
    sub.paid = isPaid || finalPaidAmount >= finalAmount;
    sub.paymentStatus = paymentStatus;
    sub.approvedBy = adminId;
    await sub.save();

    // Sync HostelSubscription
    try {
      await HostelSubscription.findOneAndUpdate(
        { hostelId: requestDoc.hostelId },
        {
          status: "Active",
          subscriptionStartDate: newStartDate,
          currentCycleStart: newStartDate,
          currentCycleEnd: newEndDate,
          nextBillingDate: newEndDate,
          paymentStatus: isPaid ? "Paid" : "Pending",
          totalAmount: finalAmount,
          renewalCount: (sub.renewalCount || 0) + 1,
        },
        { upsert: true }
      );
    } catch (e) {}

    // Update Request doc
    requestDoc.status = "approved";
    requestDoc.approvedAt = now;
    requestDoc.approvedBy = adminId;
    requestDoc.extensionDays = days;
    requestDoc.approvedAmount = finalAmount;
    requestDoc.paidAmount = finalPaidAmount;
    requestDoc.paymentStatus = paymentStatus;
    requestDoc.adminNote = adminNote;
    await requestDoc.save();

    // Create SubscriptionPayment record if payment recorded
    if (finalPaidAmount > 0 || isPaid) {
      await SubscriptionPayment.create({
        hostelId: requestDoc.hostelId,
        ownerId: requestDoc.ownerId,
        subscriptionId: sub._id,
        amount: finalPaidAmount > 0 ? finalPaidAmount : finalAmount,
        periodStart: newStartDate,
        periodEnd: newEndDate,
        paymentMethod: paymentMethod || "Manual",
        paymentGateway: "System",
        transactionId: transactionId || `TXN-EXT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        paymentStatus: "Success",
        recordedBy: adminUser.name || adminUser.role || "Admin",
        notes: `Approved extension for ${days} days (${adminNote || "Approved by Admin"})`,
        paidAt: now,
      });
    }

    // Log SubscriptionHistory
    await SubscriptionHistory.create({
      hostelId: requestDoc.hostelId,
      ownerId: requestDoc.ownerId,
      subscriptionId: sub._id,
      action: "CONTINUATION_APPROVED",
      previousStartDate: prevStartDate,
      previousEndDate: prevEndDate,
      newStartDate: newStartDate,
      newEndDate: newEndDate,
      previousAmount: requestDoc.calculatedAmount,
      newAmount: finalAmount,
      changedBy: adminUser.name || adminUser.role || "Admin",
      reason: adminNote || `Approved extension for ${days} days`,
    });

    await AuditLog.create({
      adminId: adminId,
      hostelId: requestDoc.hostelId,
      action: "APPROVE_SUBSCRIPTION",
      actionType: "APPROVE",
      entity: "SubscriptionRequest",
      targetId: requestDoc._id,
      details: {
        hostelName: requestDoc.hostelName,
        planType: requestDoc.planType,
        extensionDays: days,
        amount: finalAmount,
        message: `Approved subscription continuation of +${days} days for ${requestDoc.hostelName || "Hostel"}`
      },
      timestamp: new Date()
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Subscription continuation approved for ${days} days!`,
      subscription: sub,
      request: requestDoc,
    });
  } catch (error) {
    logger.error("approveSubscriptionRequest error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/requests/:id/reject
 */
const rejectSubscriptionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = "", adminNote = "" } = req.body;
    const finalReason = reason || adminNote || "Continuation request rejected by Admin";

    const requestDoc = await SubscriptionRequest.findById(id);
    if (!requestDoc) {
      return res.status(404).json({ success: false, message: "Subscription request not found" });
    }

    const adminUser = req.user || req.admin || {};
    const adminId = adminUser._id || adminUser.userId;

    requestDoc.status = "rejected";
    requestDoc.adminNote = finalReason;
    requestDoc.approvedBy = adminId;
    await requestDoc.save();

    let sub = await Subscription.findOne({ hostelId: requestDoc.hostelId });
    if (sub && (sub.status === "continuation_requested" || sub.subscriptionStatus === "continuation_requested")) {
      const lifecycle = getSubscriptionStatus(sub);
      sub.status = lifecycle.status === "continuation_requested" ? "Expired" : lifecycle.status;
      sub.subscriptionStatus = sub.status.toLowerCase();
      await sub.save();
    }

    // Log history
    await SubscriptionHistory.create({
      hostelId: requestDoc.hostelId,
      ownerId: requestDoc.ownerId,
      subscriptionId: sub?._id,
      action: "CONTINUATION_REJECTED",
      changedBy: adminUser.name || adminUser.role || "Admin",
      reason: finalReason,
    });

    return res.status(200).json({
      success: true,
      message: "Subscription continuation request rejected",
      request: requestDoc,
    });
  } catch (error) {
    logger.error("rejectSubscriptionRequest error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/:id/extend
 * Admin manual extension for an existing subscription
 */
const manualExtendSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { extensionDays = 30, amount = 0, paymentStatus = "Paid", reason = "" } = req.body;

    const adminUser = req.user || req.admin || {};
    const adminId = adminUser._id || adminUser.userId;
    const days = Number(extensionDays) || 30;

    let sub = await Subscription.findById(id);
    if (!sub) {
      sub = await Subscription.findOne({ hostelId: id });
    }
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription record not found" });
    }

    const now = new Date();
    const prevStartDate = sub.startDate || sub.trialStartDate || now;
    const prevEndDate = sub.endDate || sub.trialEndDate || now;

    const isCurrentlyExpired = new Date(prevEndDate).getTime() < now.getTime();
    const baseEnd = isCurrentlyExpired ? now : new Date(prevEndDate);
    const newEndDate = new Date(baseEnd.getTime() + days * 24 * 60 * 60 * 1000);

    sub.status = "Active";
    sub.subscriptionStatus = "active";
    sub.isTrial = false;
    sub.endDate = newEndDate;
    sub.subscriptionEndDate = newEndDate;
    sub.extensionDays = (sub.extensionDays || 0) + days;
    if (amount) sub.amount = Number(amount);
    if (paymentStatus) sub.paymentStatus = paymentStatus;
    sub.approvedBy = adminId;
    await sub.save();

    // Log history
    await SubscriptionHistory.create({
      hostelId: sub.hostelId,
      ownerId: sub.ownerId,
      subscriptionId: sub._id,
      action: "EXTENSION_ADDED",
      previousStartDate: prevStartDate,
      previousEndDate: prevEndDate,
      newStartDate: sub.startDate,
      newEndDate: newEndDate,
      daysAdjustment: days,
      changedBy: adminUser.name || adminUser.role || "Admin",
      reason: reason || `Manual extension of +${days} days by Admin`,
    });

    await AuditLog.create({
      adminId: adminId,
      hostelId: sub.hostelId,
      action: "EXTEND_SUBSCRIPTION",
      actionType: "EXTEND",
      entity: "Subscription",
      targetId: sub._id,
      details: {
        daysAdjustment: days,
        reason: reason || `Manual extension of +${days} days by Admin`,
        message: `Extended subscription by +${days} days`
      },
      timestamp: new Date()
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: `Subscription successfully extended by ${days} days!`,
      subscription: sub,
      daysRemaining: Math.ceil((newEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    });
  } catch (error) {
    logger.error("manualExtendSubscription error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/:id/adjust-days
 * Safe increase / decrease trial or subscription days with confirmation and reason
 */
const adjustSubscriptionDays = async (req, res) => {
  try {
    const { id } = req.params;
    const { daysAdjustment, reason } = req.body;

    if (daysAdjustment === undefined || daysAdjustment === null || isNaN(Number(daysAdjustment))) {
      return res.status(400).json({ success: false, message: "daysAdjustment (number) is required" });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Reason is required for adjusting subscription days" });
    }

    const adminUser = req.user || req.admin || {};
    const adj = Number(daysAdjustment);

    let sub = await Subscription.findById(id);
    if (!sub) {
      sub = await Subscription.findOne({ hostelId: id });
    }
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription record not found" });
    }

    const isTrial = sub.isTrial === true || (sub.status && sub.status.toLowerCase() === "trial");
    const prevEndDate = isTrial ? (sub.trialEndDate || sub.endDate) : (sub.endDate || sub.trialEndDate);
    const baseDate = prevEndDate ? new Date(prevEndDate) : new Date();
    const newEndDate = new Date(baseDate.getTime() + adj * 24 * 60 * 60 * 1000);

    if (isTrial) {
      sub.trialEndDate = newEndDate;
      sub.trialEnds = newEndDate;
    }
    sub.endDate = newEndDate;
    sub.subscriptionEndDate = newEndDate;

    const now = new Date();
    const isNowExpired = newEndDate.getTime() < now.getTime();
    if (isNowExpired) {
      sub.status = "Expired";
      sub.subscriptionStatus = "expired";
    } else {
      sub.status = isTrial ? "Trial" : "Active";
      sub.subscriptionStatus = isTrial ? "trial" : "active";
    }

    await sub.save();

    // Log history
    await SubscriptionHistory.create({
      hostelId: sub.hostelId,
      ownerId: sub.ownerId,
      subscriptionId: sub._id,
      action: adj >= 0 ? "EXTENSION_ADDED" : "EXTENSION_REDUCED",
      previousEndDate: prevEndDate,
      newEndDate: newEndDate,
      daysAdjustment: adj,
      changedBy: adminUser.name || adminUser.role || "Admin",
      reason: reason.trim(),
    });

    return res.status(200).json({
      success: true,
      message: `Subscription days successfully adjusted (${adj > 0 ? `+${adj}` : adj} days)`,
      subscription: sub,
      newEndDate,
      daysRemaining: Math.ceil((newEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)),
    });
  } catch (error) {
    logger.error("adjustSubscriptionDays error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/calculator
 * On-demand resident billing calculation for any hostel
 */
const getAdminBillingCalculator = async (req, res) => {
  try {
    const { hostelId, periodStart, periodEnd, monthlyRate = 10 } = req.query;
    if (!hostelId) {
      return res.status(400).json({ success: false, message: "hostelId query parameter is required" });
    }

    const calculation = await calculateResidentBilling({
      hostelId,
      periodStart,
      periodEnd,
      monthlyRate: Number(monthlyRate) || 10,
    });

    return res.status(200).json({ success: true, calculation });
  } catch (error) {
    logger.error("getAdminBillingCalculator error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/hostels
 * Filterable list of all hostels with dynamic days remaining and active resident billing
 */
const listHostelSubscriptions = async (req, res) => {
  try {
    const { status, search } = req.query;
    const data = await subscriptionService.getReconciledSubscriptionData();
    let result = data.subscriptions || [];

    if (status && status !== "all" && status !== "All") {
      const st = status.toLowerCase();
      if (st === "expiring" || st === "expiring_soon") {
        result = result.filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30 && item.status.toLowerCase() !== "expired");
      } else if (st === "trial") {
        result = result.filter((item) => item.isTrial || item.status.toLowerCase() === "trial");
      } else {
        result = result.filter((item) => item.status.toLowerCase() === st);
      }
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.hostelName.toLowerCase().includes(q) ||
          item.ownerName.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q) ||
          item.city.toLowerCase().includes(q) ||
          String(item.subscriptionId).toLowerCase().includes(q) ||
          String(item.hostelId).toLowerCase().includes(q)
      );
    }

    return res.status(200).json({ success: true, subscriptions: result });
  } catch (error) {
    logger.error("listHostelSubscriptions error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/:id/history
 */
const getSubscriptionHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const history = await SubscriptionHistory.find({
      $or: [{ subscriptionId: id }, { hostelId: id }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, history });
  } catch (error) {
    logger.error("getSubscriptionHistory error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// Legacy compatibility
const listFeatures = async (req, res) => {
  const features = await SubscriptionFeature.find().sort({ name: 1 });
  return res.status(200).json({ success: true, features });
};
const createFeature = async (req, res) => res.status(200).json({ success: true });
const listPlans = async (req, res) => {
  const plans = await SubscriptionPlan.find();
  return res.status(200).json({ success: true, plans });
};
const createPlan = async (req, res) => res.status(200).json({ success: true });
const updatePlan = async (req, res) => res.status(200).json({ success: true });
const getSettings = async (req, res) => res.status(200).json({ success: true, settings: {} });
const updateSettings = async (req, res) => res.status(200).json({ success: true });
const overrideHostelSubscription = manualExtendSubscription;
const getReminderLogs = async (req, res) => {
  const logs = await ReminderLog.find().sort({ sentTime: -1 }).limit(100);
  return res.status(200).json({ success: true, logs });
};
const addInternalNote = async (req, res) => res.status(200).json({ success: true });
const exportRevenueExcel = async (req, res) => res.status(200).json({ success: true });
const exportSubscriptionsCSV = async (req, res) => res.status(200).json({ success: true });

module.exports = {
  getSuperAdminDashboard,
  listSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  manualExtendSubscription,
  adjustSubscriptionDays,
  getAdminBillingCalculator,
  listHostelSubscriptions,
  getSubscriptionHistory,
  listFeatures,
  createFeature,
  listPlans,
  createPlan,
  updatePlan,
  getSettings,
  updateSettings,
  overrideHostelSubscription,
  getReminderLogs,
  addInternalNote,
  exportRevenueExcel,
  exportSubscriptionsCSV,
};
