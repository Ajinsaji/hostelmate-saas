const Subscription = require("../models/Subscription");
const HostelSubscription = require("../models/HostelSubscription");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const SubscriptionHistory = require("../models/SubscriptionHistory");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const SubscriptionFeature = require("../models/SubscriptionFeature");
const BillingSettings = require("../models/BillingSettings");
const Resident = require("../models/Resident");
const Hostel = require("../models/Hostel");
const Plan = require("../models/Plan");
const Invoice = require("../models/Invoice");
const { calculateResidentBilling } = require("../utils/residentBillingCalculator");
const getSubscriptionStatus = require("../utils/getSubscriptionStatus");
const { logger } = require("../utils/logger");

const DEFAULT_FEATURES = [
  { name: "Staff Management", code: "canUseStaff", description: "Manage hostel staff & roles", category: "Core", isPremium: false },
  { name: "Food & Mess Management", code: "canUseFood", description: "Manage mess menu & attendance", category: "Operations", isPremium: false },
  { name: "Visitor Log", code: "canUseVisitors", description: "Track visitor entries & passes", category: "Operations", isPremium: false },
  { name: "Expense Tracker", code: "canUseExpenses", description: "Log and report hostel expenses", category: "Operations", isPremium: false },
  { name: "WhatsApp Notifications", code: "canSendWhatsApp", description: "Send automated WhatsApp rent receipts & alerts", category: "Communication", isPremium: false },
  { name: "AI Analytics & Predictions", code: "canUseAI", description: "Predict occupancy & automated insights", category: "Advanced", isPremium: false },
  { name: "Payroll Engine", code: "payroll", description: "Calculate staff salaries and generate payslips", category: "Finance", isPremium: false },
  { name: "Business Analytics", code: "analytics", description: "Deep business analytics & reports", category: "Advanced", isPremium: false },
  { name: "Reports Export", code: "reports", description: "Export CSV and PDF reports", category: "Operations", isPremium: false },
  { name: "Plugin Marketplace", code: "marketplace", description: "White-label & plugins", category: "Advanced", isPremium: false },
];

async function getBillingSettings() {
  try {
    let settings = await BillingSettings.findOne();
    if (!settings) {
      settings = await BillingSettings.create({
        trialDays: 30,
        gracePeriodDays: 3,
        reminderDays: [7, 2, 1],
        dueReminderIntervalHours: 5,
        residentChargeMode: "Per Active Resident",
      });
    }
    return settings;
  } catch (err) {
    logger.error({ err, operation: "getBillingSettings", component: "SubscriptionService" }, "Failed to fetch or seed billing settings");
    return {
      trialDays: 30,
      gracePeriodDays: 3,
      reminderDays: [7, 2, 1],
      dueReminderIntervalHours: 5,
      residentChargeMode: "Per Active Resident",
    };
  }
}

async function seedDefaultFeaturesAndPlans() {
  try {
    const featureDocs = [];
    for (const f of DEFAULT_FEATURES) {
      let feat = await SubscriptionFeature.findOne({ code: f.code });
      if (!feat) {
        feat = await SubscriptionFeature.create(f);
      }
      featureDocs.push(feat);
    }

    const settings = await getBillingSettings();

    let unifiedPlan = await SubscriptionPlan.findOne({ name: "HostelMate Unified" });
    if (!unifiedPlan) {
      unifiedPlan = await SubscriptionPlan.create({
        name: "HostelMate Unified",
        description: "Full access to all HostelMate features with ₹10/resident/month pricing",
        monthlyPrice: 0,
        trialPrice: 0,
        residentChargePerResident: 10,
        durationDays: 30,
        features: featureDocs.map((f) => f._id),
        addons: ["whatsapp_premium", "ai_module", "payroll", "multi_branch", "analytics"],
        isActive: true,
      });
    }

    logger.info({ operation: "seedDefaultFeaturesAndPlans", component: "SubscriptionService", featuresCount: featureDocs.length }, "✓ Subscription features & plans initialized");
    return { settings, unifiedPlan };
  } catch (error) {
    logger.error({ err: error, operation: "seedDefaultFeaturesAndPlans", component: "SubscriptionService" }, "Error seeding subscription defaults");
    throw error;
  }
}

async function getActiveResidentCount(hostelId) {
  return await Resident.countDocuments({
    hostelId,
    isDeleted: false,
    status: { $in: ["Active", "active"] },
  });
}

/**
 * Initializes a new 30-day Free Trial subscription for a hostel
 */
async function initializeTrialSubscription(hostelId, ownerId = null) {
  try {
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    let sub = await Subscription.findOne({ hostelId });
    if (!sub) {
      sub = await Subscription.create({
        hostelId,
        ownerId,
        planType: "Unified",
        plan: "Unified",
        status: "trial",
        subscriptionStatus: "trial",
        isTrial: true,
        trialDays: 30,
        startDate: now,
        endDate: trialEndDate,
        trialStartDate: now,
        trialEndDate: trialEndDate,
        subscriptionStartDate: now,
        subscriptionEndDate: trialEndDate,
        amount: 0,
        paidAmount: 0,
        paid: false,
        paymentStatus: "Pending",
        monthlyRatePerResident: 10,
      });

      await SubscriptionHistory.create({
        hostelId,
        ownerId,
        subscriptionId: sub._id,
        action: "TRIAL_STARTED",
        newStartDate: now,
        newEndDate: trialEndDate,
        newAmount: 0,
        changedBy: "System",
        reason: "30-day Free Trial Initialized",
      });
    }

    try {
      await HostelSubscription.findOneAndUpdate(
        { hostelId },
        {
          hostelId,
          status: "Trial",
          trialStartDate: now,
          trialEndDate: trialEndDate,
          subscriptionStartDate: now,
          currentCycleStart: now,
          currentCycleEnd: trialEndDate,
          nextBillingDate: trialEndDate,
          paymentStatus: "Paid",
          totalAmount: 0,
        },
        { upsert: true, new: true }
      );
    } catch (e) {}

    return sub;
  } catch (err) {
    logger.error("initializeTrialSubscription error:", err);
    throw err;
  }
}

/**
 * Retrieves full unified subscription details for an owner dashboard / subscription page
 */
async function getOwnerSubscriptionDetails(hostelId) {
  let sub = await Subscription.findOne({ hostelId });
  if (!sub) {
    sub = await initializeTrialSubscription(hostelId);
  }

  const now = new Date();
  const lifecycle = getSubscriptionStatus(sub);

  const activeResidents = await getActiveResidentCount(hostelId);
  const billingCalc = await calculateResidentBilling({ hostelId });

  // Look for active/latest continuation request
  const pendingRequest = await SubscriptionRequest.findOne({
    hostelId,
    status: "pending",
  }).sort({ createdAt: -1 });

  const latestRequest = await SubscriptionRequest.findOne({
    hostelId,
  }).sort({ createdAt: -1 });

  const recentHistory = await SubscriptionHistory.find({ hostelId })
    .sort({ createdAt: -1 })
    .limit(10);

  const isTrial = sub.isTrial === true || (sub.status && sub.status.toLowerCase() === "trial");
  const targetExpiry = lifecycle.expiryDate || (isTrial ? sub.trialEndDate : sub.endDate);

  const daysRemaining = typeof lifecycle.daysLeft === "number" ? lifecycle.daysLeft : 0;
  const isExpired = lifecycle.expired || daysRemaining < 0;

  return {
    subscriptionId: sub._id,
    planType: "Unified",
    planName: "HostelMate Unified Plan",
    status: lifecycle.status,
    isTrial,
    isExpired,
    daysRemaining,
    startDate: sub.startDate || sub.trialStartDate || sub.subscriptionStartDate,
    endDate: targetExpiry,
    trialStartDate: sub.trialStartDate,
    trialEndDate: sub.trialEndDate,
    activeResidents,
    monthlyRate: 10,
    estimatedMonthlyAmount: billingCalc.fullPeriodCharge || activeResidents * 10,
    proratedAmount: billingCalc.proratedCharge,
    totalCalculatedAmount: billingCalc.totalAmount,
    billingBreakdown: billingCalc,
    paidAmount: sub.paidAmount || 0,
    paid: sub.paid || false,
    paymentStatus: sub.paymentStatus || (sub.paid ? "Paid" : "Pending"),
    hasPendingRequest: !!pendingRequest,
    pendingRequest,
    latestRequest,
    warningLevel: lifecycle.warningLevel,
    showBanner: lifecycle.showBanner,
    history: recentHistory,
  };
}

/**
 * Superadmin Subscription Analytics
 */
async function getSuperAdminAnalytics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    trialCount,
    activeCount,
    expiredCount,
    pendingRequestsCount,
    totalActiveResidents,
  ] = await Promise.all([
    Subscription.countDocuments({
      $or: [{ status: { $in: ["trial", "Trial"] } }, { isTrial: true }],
    }),
    Subscription.countDocuments({
      status: { $in: ["active", "Active"] },
      isTrial: false,
    }),
    Subscription.countDocuments({
      status: { $in: ["expired", "Expired"] },
    }),
    SubscriptionRequest.countDocuments({ status: "pending" }),
    Resident.countDocuments({ status: { $in: ["Active", "active"] }, isDeleted: false }),
  ]);

  const monthlyPayments = await SubscriptionPayment.aggregate([
    { $match: { paymentStatus: { $in: ["Success", "Paid", "paid"] }, paidAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const monthlyRevenue = monthlyPayments[0]?.total || 0;

  const expectedRevenue = totalActiveResidents * 10;

  return {
    trialHostels: trialCount,
    activeSubscribers: activeCount,
    expiredHostels: expiredCount,
    pendingRequests: pendingRequestsCount,
    totalActiveResidents,
    monthlyRevenue,
    expectedRevenue,
    residentRevenue: monthlyRevenue,
    platformRevenue: 0,
    pendingCollections: Math.max(0, expectedRevenue - monthlyRevenue),
  };
}

module.exports = {
  getBillingSettings,
  seedDefaultFeaturesAndPlans,
  getActiveResidentCount,
  initializeTrialSubscription,
  getOwnerSubscriptionDetails,
  getSuperAdminAnalytics,
};
