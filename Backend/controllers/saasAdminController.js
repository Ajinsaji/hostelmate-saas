const SubscriptionFeature = require("../models/SubscriptionFeature");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const HostelSubscription = require("../models/HostelSubscription");
const BillingSettings = require("../models/BillingSettings");
const ReminderLog = require("../models/ReminderLog");
const Hostel = require("../models/Hostel");
const subscriptionService = require("../services/subscriptionService");
const { planSchema, featureSchema, billingSettingsSchema } = require("../validations/subscriptionValidation");
const { logger } = require("../utils/logger");

/**
 * GET /api/admin/subscriptions/dashboard
 * Super Admin Analytics Overview
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
 * GET /api/admin/subscriptions/features
 */
const listFeatures = async (req, res) => {
  try {
    const features = await SubscriptionFeature.find().sort({ category: 1, name: 1 });
    return res.status(200).json({ success: true, features });
  } catch (error) {
    logger.error("listFeatures error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/features
 */
const createFeature = async (req, res) => {
  try {
    const { error, value } = featureSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existing = await SubscriptionFeature.findOne({ code: value.code.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Feature code already exists" });
    }

    const feature = await SubscriptionFeature.create(value);
    return res.status(201).json({ success: true, feature });
  } catch (error) {
    logger.error("createFeature error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/plans
 */
const listPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.find().populate("features").sort({ monthlyPrice: 1 });
    return res.status(200).json({ success: true, plans });
  } catch (error) {
    logger.error("listPlans error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/plans
 */
const createPlan = async (req, res) => {
  try {
    const { error, value } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const existing = await SubscriptionPlan.findOne({ name: value.name.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: "Plan name already exists" });
    }

    const plan = await SubscriptionPlan.create(value);
    return res.status(201).json({ success: true, plan });
  } catch (error) {
    logger.error("createPlan error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * PUT /api/admin/subscriptions/plans/:id
 */
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = planSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const plan = await SubscriptionPlan.findByIdAndUpdate(id, value, { new: true }).populate("features");
    if (!plan) {
      return res.status(404).json({ success: false, message: "Plan not found" });
    }

    return res.status(200).json({ success: true, plan });
  } catch (error) {
    logger.error("updatePlan error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/settings
 */
const getSettings = async (req, res) => {
  try {
    const settings = await subscriptionService.getBillingSettings();
    return res.status(200).json({ success: true, settings });
  } catch (error) {
    logger.error("getSettings error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * PUT /api/admin/subscriptions/settings
 */
const updateSettings = async (req, res) => {
  try {
    const { error, value } = billingSettingsSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    let settings = await BillingSettings.findOne();
    if (!settings) {
      settings = await BillingSettings.create({ ...value, updatedBy: req.admin?._id });
    } else {
      settings = await BillingSettings.findByIdAndUpdate(
        settings._id,
        { ...value, updatedBy: req.admin?._id },
        { new: true }
      );
    }

    return res.status(200).json({ success: true, settings });
  } catch (error) {
    logger.error("updateSettings error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/hostels
 * Filterable list of hostels by subscription status
 */
const listHostelSubscriptions = async (req, res) => {
  try {
    const { status, plan } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (plan) {
      const planDoc = await SubscriptionPlan.findOne({ name: plan });
      if (planDoc) filter.currentPlan = planDoc._id;
    }

    const subscriptions = await HostelSubscription.find(filter)
      .populate("hostelId")
      .populate("currentPlan")
      .sort({ createdAt: -1 });

    const formatted = await Promise.all(
      subscriptions.map(async (sub) => {
        const activeResidents = await subscriptionService.getActiveResidentCount(sub.hostelId?._id);
        const now = new Date();
        const expiry = sub.nextBillingDate || sub.trialEndDate || sub.currentCycleEnd;
        let daysLeft = 0;
        if (expiry) {
          daysLeft = Math.ceil((new Date(expiry).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        }

        return {
          subscriptionId: sub._id,
          hostelId: sub.hostelId?._id,
          hostelName: sub.hostelId?.hostelName || "Unknown Hostel",
          ownerName: sub.hostelId?.ownerName || "Unknown Owner",
          phone: sub.hostelId?.phone || "-",
          plan: sub.currentPlan?.name || "Trial",
          amount: sub.totalAmount,
          status: sub.status,
          activeResidents,
          nextBillingDate: sub.nextBillingDate,
          daysRemaining: daysLeft,
          trial: sub.status === "Trial",
          reminderStage: sub.reminderStage,
        };
      })
    );

    return res.status(200).json({ success: true, subscriptions: formatted });
  } catch (error) {
    logger.error("listHostelSubscriptions error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/override
 * Manual Super Admin override (extend days, change plan, change status)
 */
const overrideHostelSubscription = async (req, res) => {
  try {
    const { hostelId, planId, status, extendDays } = req.body;

    let sub = await HostelSubscription.findOne({ hostelId });
    if (!sub) {
      return res.status(404).json({ success: false, message: "Hostel subscription record not found" });
    }

    if (planId) {
      sub.currentPlan = planId;
    }

    if (status) {
      sub.status = status;
    }

    if (extendDays && Number(extendDays) > 0) {
      const baseDate = sub.nextBillingDate || new Date();
      sub.nextBillingDate = new Date(baseDate.getTime() + Number(extendDays) * 24 * 60 * 60 * 1000);
      sub.currentCycleEnd = sub.nextBillingDate;
    }

    await sub.save();

    return res.status(200).json({
      success: true,
      message: "Subscription updated successfully by admin override",
      subscription: sub,
    });
  } catch (error) {
    logger.error("overrideHostelSubscription error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/reminder-logs
 */
const getReminderLogs = async (req, res) => {
  try {
    const logs = await ReminderLog.find()
      .populate("hostelId", "hostelName ownerName")
      .sort({ sentTime: -1 })
      .limit(100);

    return res.status(200).json({ success: true, logs });
  } catch (error) {
    logger.error("getReminderLogs error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * POST /api/admin/subscriptions/notes
 * Add internal admin note to hostel subscription (hidden from owner)
 */
const addInternalNote = async (req, res) => {
  try {
    const { hostelId, note } = req.body;
    if (!hostelId || !note) {
      return res.status(400).json({ success: false, message: "hostelId and note are required" });
    }

    let sub = await HostelSubscription.findOne({ hostelId });
    if (!sub) {
      return res.status(404).json({ success: false, message: "Subscription record not found" });
    }

    sub.internalNotes.push({
      note,
      createdBy: req.admin?._id,
      createdByName: req.admin?.name || "Admin",
      createdAt: new Date(),
    });

    await sub.save();
    return res.status(200).json({ success: true, message: "Internal note saved", internalNotes: sub.internalNotes });
  } catch (error) {
    logger.error("addInternalNote error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/admin/subscriptions/export/excel
 * Export Revenue & Invoices Report to Excel (.xlsx)
 */
const exportRevenueExcel = async (req, res) => {
  try {
    const { generateRevenueExcelReport } = require("../services/exportService");
    const buffer = await generateRevenueExcelReport();

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=HostelMate_Revenue_Report.xlsx");
    return res.send(buffer);
  } catch (error) {
    logger.error("exportRevenueExcel error:", error);
    return res.status(500).json({ success: false, message: error.message || "Export error" });
  }
};

/**
 * GET /api/admin/subscriptions/export/csv
 * Export Subscriptions Report to CSV (.csv)
 */
const exportSubscriptionsCSV = async (req, res) => {
  try {
    const { generateSubscriptionsCSV } = require("../services/exportService");
    const csv = await generateSubscriptionsCSV();

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=HostelMate_Subscriptions.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("exportSubscriptionsCSV error:", error);
    return res.status(500).json({ success: false, message: error.message || "Export error" });
  }
};

module.exports = {
  getSuperAdminDashboard,
  listFeatures,
  createFeature,
  listPlans,
  createPlan,
  updatePlan,
  getSettings,
  updateSettings,
  listHostelSubscriptions,
  overrideHostelSubscription,
  getReminderLogs,
  addInternalNote,
  exportRevenueExcel,
  exportSubscriptionsCSV,
};


