const SubscriptionFeature = require("../models/SubscriptionFeature");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const HostelSubscription = require("../models/HostelSubscription");
const Invoice = require("../models/Invoice");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const BillingSettings = require("../models/BillingSettings");
const Resident = require("../models/Resident");
const Hostel = require("../models/Hostel");
const { logger } = require("../utils/logger");

const DEFAULT_FEATURES = [
  { name: "Staff Management", code: "canUseStaff", description: "Manage hostel staff & roles", category: "Core", isPremium: false },
  { name: "Food & Mess Management", code: "canUseFood", description: "Manage mess menu & attendance", category: "Operations", isPremium: false },
  { name: "Visitor Log", code: "canUseVisitors", description: "Track visitor entries & passes", category: "Operations", isPremium: false },
  { name: "Expense Tracker", code: "canUseExpenses", description: "Log and report hostel expenses", category: "Operations", isPremium: false },
  { name: "WhatsApp Notifications", code: "canSendWhatsApp", description: "Send automated WhatsApp rent receipts & alerts", category: "Communication", isPremium: true },
  { name: "AI Analytics & Predictions", code: "canUseAI", description: "Predict occupancy & automated insights", category: "Advanced", isPremium: true },
];

/**
 * Ensures initial features, plans, and billing settings exist in DB
 */
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

    const featureMap = {};
    featureDocs.forEach((f) => {
      featureMap[f.code] = f._id;
    });

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

    let trialPlan = await SubscriptionPlan.findOne({ name: "Trial" });
    if (!trialPlan) {
      trialPlan = await SubscriptionPlan.create({
        name: "Trial",
        description: "30 days full feature trial for new hostels",
        monthlyPrice: 0,
        trialPrice: 500,
        residentChargePerResident: 10,
        durationDays: settings.trialDays || 30,
        features: Object.values(featureMap),
        addons: ["whatsapp_premium", "ai_module"],
        isActive: true,
      });
    }

    let basePlan = await SubscriptionPlan.findOne({ name: "Base" });
    if (!basePlan) {
      basePlan = await SubscriptionPlan.create({
        name: "Base",
        description: "Essential management tools for hostels",
        monthlyPrice: 1000,
        trialPrice: 0,
        residentChargePerResident: 10,
        durationDays: 30,
        features: [featureMap.canUseStaff, featureMap.canUseFood, featureMap.canUseExpenses].filter(Boolean),
        addons: [],
        isActive: true,
      });
    }

    let proPlan = await SubscriptionPlan.findOne({ name: "Pro" });
    if (!proPlan) {
      proPlan = await SubscriptionPlan.create({
        name: "Pro",
        description: "Advanced hostel management with AI & WhatsApp integration",
        monthlyPrice: 2000,
        trialPrice: 0,
        residentChargePerResident: 10,
        durationDays: 30,
        features: Object.values(featureMap),
        addons: ["whatsapp_premium", "ai_module", "payroll", "multi_branch", "biometric", "api_access"],
        isActive: true,
      });
    }

    return { settings, trialPlan, basePlan, proPlan };
  } catch (error) {
    logger.error("Error seeding subscription defaults:", error);
  }
}

async function getBillingSettings() {
  let settings = await BillingSettings.findOne();
  if (!settings) {
    await seedDefaultFeaturesAndPlans();
    settings = await BillingSettings.findOne();
  }
  return settings;
}

async function getActiveResidentCount(hostelId) {
  return await Resident.countDocuments({ hostelId, status: "active" });
}

async function initializeTrialSubscription(hostelId) {
  try {
    const settings = await getBillingSettings();
    let trialPlan = await SubscriptionPlan.findOne({ name: "Trial" });
    if (!trialPlan) {
      await seedDefaultFeaturesAndPlans();
      trialPlan = await SubscriptionPlan.findOne({ name: "Trial" });
    }

    const now = new Date();
    const trialEndDate = new Date(now.getTime() + (settings.trialDays || 30) * 24 * 60 * 60 * 1000);

    const activeResidents = await getActiveResidentCount(hostelId);
    const residentCharge = activeResidents * (trialPlan.residentChargePerResident || 10);
    const totalAmount = trialPlan.trialPrice + residentCharge;

    let sub = await HostelSubscription.findOne({ hostelId });

    if (!sub) {
      sub = await HostelSubscription.create({
        hostelId,
        currentPlan: trialPlan._id,
        status: "Trial",
        trialStartDate: now,
        trialEndDate: trialEndDate,
        subscriptionStartDate: now,
        currentCycleStart: now,
        currentCycleEnd: trialEndDate,
        nextBillingDate: trialEndDate,
        platformAmount: trialPlan.trialPrice,
        residentCharge: residentCharge,
        totalAmount: totalAmount,
        activeResidentCount: activeResidents,
        paymentStatus: "Paid",
        reminderStage: "None",
        planHistory: [{ planName: "Trial", planId: trialPlan._id, changedAt: now, reason: "Initial registration trial" }],
        activityTimeline: [{ title: "Trial Started", description: "30-day Pro features trial initiated", category: "Subscription", timestamp: now }],
      });
    }

    return sub;
  } catch (err) {
    logger.error("initializeTrialSubscription error:", err);
    throw err;
  }
}

async function calculateBilling(hostelId, planId = null) {
  const activeResidents = await getActiveResidentCount(hostelId);

  let plan = null;
  if (planId) {
    plan = await SubscriptionPlan.findById(planId).populate("features");
  } else {
    const sub = await HostelSubscription.findOne({ hostelId }).populate("currentPlan");
    plan = sub?.currentPlan || (await SubscriptionPlan.findOne({ name: "Trial" }).populate("features"));
  }

  if (!plan) throw new Error("Subscription plan not found");

  const platformAmount = plan.monthlyPrice || 0;
  const residentChargeRate = plan.residentChargePerResident || 10;
  const residentCharge = activeResidents * residentChargeRate;
  const totalAmount = platformAmount + residentCharge;

  return {
    plan,
    activeResidents,
    platformAmount,
    residentChargeRate,
    residentCharge,
    totalAmount,
  };
}

async function calculateUpgrade(hostelId, newPlanId) {
  const newPlan = await SubscriptionPlan.findById(newPlanId).populate("features");
  if (!newPlan) throw new Error("Target subscription plan not found");

  const currentSub = await HostelSubscription.findOne({ hostelId }).populate("currentPlan");
  const activeResidents = await getActiveResidentCount(hostelId);

  let paidAmount = 0;
  if (currentSub) {
    paidAmount = currentSub.platformAmount || 0;
  }

  const newPlatformAmount = newPlan.monthlyPrice || 0;
  const priceDifference = Math.max(0, newPlatformAmount - paidAmount);
  const residentChargeRate = newPlan.residentChargePerResident || 10;
  const residentCharge = activeResidents * residentChargeRate;
  const totalDue = priceDifference + residentCharge;

  return {
    currentPlanName: currentSub?.currentPlan?.name || "Trial",
    paidAmount,
    newPlan,
    newPlatformAmount,
    priceDifference,
    residentChargeRate,
    activeResidents,
    residentCharge,
    totalDue,
  };
}

async function processPaymentAndRenewal(hostelId, planId, paymentMethod = "Razorpay", transactionId = null, paymentStatus = "Success", errorMessage = "") {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const activeResidents = await getActiveResidentCount(hostelId);
  const upgradeCalc = await calculateUpgrade(hostelId, planId);
  const totalAmount = upgradeCalc.totalDue;
  const billingDate = new Date();
  const duration = plan.durationDays || 30;
  const nextBillingDate = new Date(billingDate.getTime() + duration * 24 * 60 * 60 * 1000);

  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-${billingDate.getFullYear()}${String(billingDate.getMonth() + 1).padStart(2, "0")}-${String(count + 1001).padStart(5, "0")}`;

  // 1. Create Invoice with frozen Billing Snapshot
  const invoice = await Invoice.create({
    hostelId,
    invoiceNumber,
    billingDate,
    dueDate: billingDate,
    paymentDate: paymentStatus === "Success" ? billingDate : null,
    planName: plan.name,
    planPrice: upgradeCalc.priceDifference > 0 ? upgradeCalc.priceDifference : plan.monthlyPrice,
    residentChargeRate: plan.residentChargePerResident || 10,
    activeResidents: activeResidents,
    residentCharge: upgradeCalc.residentCharge,
    totalAmount: totalAmount,
    paymentStatus: paymentStatus === "Success" ? "Paid" : "Failed",
  });

  // 2. Determine Payment Attempt Number & Create SubscriptionPayment Record
  const attemptCount = await SubscriptionPayment.countDocuments({ invoiceId: invoice._id });
  const payment = await SubscriptionPayment.create({
    hostelId,
    invoiceId: invoice._id,
    attemptNumber: attemptCount + 1,
    amount: totalAmount,
    paymentMethod,
    paymentGateway: paymentMethod === "Manual" ? "System" : "Razorpay",
    transactionId: transactionId || `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    paymentStatus,
    errorMessage,
    paidAt: billingDate,
  });

  if (paymentStatus === "Failed") {
    let subFail = await HostelSubscription.findOne({ hostelId });
    if (subFail) {
      subFail.activityTimeline.push({
        title: "Payment Attempt Failed",
        description: `Payment attempt #${attemptCount + 1} of ₹${totalAmount} failed (${errorMessage || "Declined"})`,
        category: "Billing",
        timestamp: billingDate,
      });
      await subFail.save();
    }
    return { invoice, payment, subscription: subFail, success: false };
  }

  // 3. Update HostelSubscription on Payment Success
  let sub = await HostelSubscription.findOne({ hostelId });
  const renewalCount = (sub?.renewalCount || 0) + 1;

  if (sub) {
    sub.currentPlan = plan._id;
    sub.status = "Active";
    sub.subscriptionStartDate = sub.subscriptionStartDate || billingDate;
    sub.currentCycleStart = billingDate;
    sub.currentCycleEnd = nextBillingDate;
    sub.nextBillingDate = nextBillingDate;
    sub.lastPaymentDate = billingDate;
    sub.platformAmount = plan.monthlyPrice;
    sub.residentCharge = upgradeCalc.residentCharge;
    sub.totalAmount = plan.monthlyPrice + upgradeCalc.residentCharge;
    sub.activeResidentCount = activeResidents;
    sub.paymentStatus = "Paid";
    sub.renewalCount = renewalCount;
    sub.reminderStage = "None";

    // Track Plan History & Activity Timeline Feed
    sub.planHistory.push({
      planName: plan.name,
      planId: plan._id,
      changedAt: billingDate,
      reason: `Subscribed / Upgraded to ${plan.name}`,
    });

    sub.activityTimeline.push({
      title: `Subscribed to ${plan.name}`,
      description: `Payment of ₹${totalAmount} received successfully (Invoice: ${invoiceNumber})`,
      category: "Billing",
      timestamp: billingDate,
    });

    await sub.save();
  }

  invoice.subscriptionId = sub?._id;
  await invoice.save();

  return { invoice, payment, subscription: sub, success: true };
}

async function getOwnerSubscriptionDetails(hostelId) {
  let sub = await HostelSubscription.findOne({ hostelId })
    .populate({
      path: "currentPlan",
      populate: { path: "features" },
    });

  if (!sub) {
    sub = await initializeTrialSubscription(hostelId);
    sub = await HostelSubscription.findOne({ hostelId }).populate({
      path: "currentPlan",
      populate: { path: "features" },
    });
  }

  const settings = await getBillingSettings();
  const now = new Date();
  const targetExpiry = sub.nextBillingDate || sub.trialEndDate || sub.currentCycleEnd;

  let daysRemaining = 0;
  if (targetExpiry) {
    const diffMs = new Date(targetExpiry).getTime() - now.getTime();
    daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
  }

  let status = sub.status;
  if (daysRemaining < 0) {
    const pastDays = Math.abs(daysRemaining);
    if (pastDays <= (settings.gracePeriodDays || 3)) {
      status = "Grace Period";
    } else {
      status = "Expired";
    }
    if (sub.status !== status && sub.status !== "Suspended" && sub.status !== "Cancelled") {
      sub.status = status;
      await sub.save();
    }
  }

  const activeResidents = await getActiveResidentCount(hostelId);
  const plan = sub.currentPlan;
  const residentChargeRate = plan?.residentChargePerResident || 10;
  const currentResidentCharge = activeResidents * residentChargeRate;
  const currentPlatformFee = plan?.monthlyPrice || 0;
  const currentTotalAmount = currentPlatformFee + currentResidentCharge;

  const permissions = (plan?.features || []).map((f) => f.code);
  const invoices = await Invoice.find({ hostelId }).sort({ createdAt: -1 }).limit(10);

  return {
    subscriptionId: sub._id,
    currentPlan: {
      _id: plan?._id,
      name: plan?.name || "Trial",
      description: plan?.description,
      monthlyPrice: plan?.monthlyPrice || 0,
      trialPrice: plan?.trialPrice || 0,
      residentChargePerResident: residentChargeRate,
      features: plan?.features || [],
      addons: plan?.addons || [],
    },
    status: sub.status,
    daysRemaining,
    inGracePeriod: status === "Grace Period",
    isExpired: status === "Expired" || status === "Suspended",
    trialStartDate: sub.trialStartDate,
    trialEndDate: sub.trialEndDate,
    currentCycleStart: sub.currentCycleStart,
    currentCycleEnd: sub.currentCycleEnd,
    nextBillingDate: sub.nextBillingDate,
    lastPaymentDate: sub.lastPaymentDate,
    activeResidents,
    platformFee: currentPlatformFee,
    residentChargeRate,
    residentCharge: currentResidentCharge,
    totalAmount: currentTotalAmount,
    renewalCount: sub.renewalCount,
    permissions,
    invoices,
    activityTimeline: sub.activityTimeline || [],
    planHistory: sub.planHistory || [],
  };
}

async function getSuperAdminAnalytics() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const endOfTomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2);
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    trialCount,
    baseCount,
    proCount,
    graceCount,
    expiredCount,
    renewalsTodayCount,
    totalActiveResidentsCount,
  ] = await Promise.all([
    HostelSubscription.countDocuments({ status: "Trial" }),
    HostelSubscription.countDocuments({ status: "Active" }).populate("currentPlan").then(async () => {
      const basePlan = await SubscriptionPlan.findOne({ name: "Base" });
      return basePlan ? HostelSubscription.countDocuments({ status: "Active", currentPlan: basePlan._id }) : 0;
    }),
    HostelSubscription.countDocuments({ status: "Active" }).populate("currentPlan").then(async () => {
      const proPlan = await SubscriptionPlan.findOne({ name: "Pro" });
      return proPlan ? HostelSubscription.countDocuments({ status: "Active", currentPlan: proPlan._id }) : 0;
    }),
    HostelSubscription.countDocuments({ status: "Grace Period" }),
    HostelSubscription.countDocuments({ status: "Expired" }),
    HostelSubscription.countDocuments({
      lastPaymentDate: { $gte: startOfDay },
    }),
    Resident.countDocuments({ status: "active" }),
  ]);

  // Dynamic Monthly Payments
  const monthlyPayments = await SubscriptionPayment.aggregate([
    { $match: { paymentStatus: "Success", paidAt: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const monthlyRevenue = monthlyPayments[0]?.total || 0;

  // Paid Revenue Breakdown
  const invoiceRevenueBreakdown = await Invoice.aggregate([
    { $match: { paymentStatus: "Paid" } },
    {
      $group: {
        _id: null,
        totalPlatform: { $sum: "$planPrice" },
        totalResident: { $sum: "$residentCharge" },
        totalRevenue: { $sum: "$totalAmount" },
      },
    },
  ]);

  const platformRevenue = invoiceRevenueBreakdown[0]?.totalPlatform || 0;
  const residentRevenue = invoiceRevenueBreakdown[0]?.totalResident || 0;

  // Expected Revenue from active subscriptions next cycle
  const activeSubs = await HostelSubscription.find({
    status: { $in: ["Active", "Trial", "Grace Period"] },
  }).populate("currentPlan");

  let expectedRevenue = 0;
  for (const sub of activeSubs) {
    const residents = await getActiveResidentCount(sub.hostelId);
    const planFee = sub.currentPlan?.monthlyPrice || 0;
    const resRate = sub.currentPlan?.residentChargePerResident || 10;
    expectedRevenue += planFee + residents * resRate;
  }

  // Pending Collections
  const pendingCollectionsAgg = await Invoice.aggregate([
    { $match: { paymentStatus: { $in: ["Pending", "Overdue"] } } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const pendingCollections = pendingCollectionsAgg[0]?.total || 0;

  // Cash Flow Projections based on nextBillingDate
  let cashFlowToday = 0;
  let cashFlowTomorrow = 0;
  let cashFlowThisWeek = 0;
  let cashFlowThisMonth = 0;

  for (const sub of activeSubs) {
    if (!sub.nextBillingDate) continue;
    const residents = await getActiveResidentCount(sub.hostelId);
    const billAmount = (sub.currentPlan?.monthlyPrice || 0) + residents * (sub.currentPlan?.residentChargePerResident || 10);
    const billDate = new Date(sub.nextBillingDate);

    if (billDate >= startOfDay && billDate < startOfTomorrow) cashFlowToday += billAmount;
    if (billDate >= startOfTomorrow && billDate < endOfTomorrow) cashFlowTomorrow += billAmount;
    if (billDate >= startOfWeek) cashFlowThisWeek += billAmount;
    if (billDate >= startOfMonth) cashFlowThisMonth += billAmount;
  }

  return {
    trialHostels: trialCount,
    baseSubscribers: baseCount,
    proSubscribers: proCount,
    gracePeriodHostels: graceCount,
    expiredHostels: expiredCount,
    renewalsToday: renewalsTodayCount,
    totalActiveResidents: totalActiveResidentsCount,
    monthlyRevenue,
    expectedRevenue,
    platformRevenue,
    residentRevenue,
    pendingCollections,
    cashFlow: {
      today: cashFlowToday,
      tomorrow: cashFlowTomorrow,
      thisWeek: cashFlowThisWeek,
      thisMonth: cashFlowThisMonth,
    },
  };
}

module.exports = {
  seedDefaultFeaturesAndPlans,
  getBillingSettings,
  getActiveResidentCount,
  initializeTrialSubscription,
  calculateBilling,
  calculateUpgrade,
  processPaymentAndRenewal,
  getOwnerSubscriptionDetails,
  getSuperAdminAnalytics,
};
