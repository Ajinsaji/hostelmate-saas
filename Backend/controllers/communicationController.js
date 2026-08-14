"use strict";

const Communication = require("../models/Communication");
const SystemSetting = require("../models/SystemSetting");
const Hostel = require("../models/Hostel");
const { logger } = require("../utils/logger");
const { validateWhatsAppConfig, verifyMetaWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");
const { dispatchWhatsAppMessage, TEMPLATES } = require("../services/whatsappService");

// 1. Get Communication Settings (Global & Hostel Level)
const getCommunicationSettings = async (req, res) => {
  try {
    const hostelId = req.query.hostelId || req.user?.hostelId;
    const systemSettings = (await SystemSetting.findOne().lean()) || {};
    let hostel = null;
    if (hostelId) {
      hostel = await Hostel.findById(hostelId).lean();
    }

    const metaConfig = validateWhatsAppConfig();

    return res.status(200).json({
      success: true,
      globalAutomationEnabled: Boolean(systemSettings.whatsappAutomationEnabled),
      hostelAutomationEnabled: Boolean(hostel?.whatsappConfig?.automationEnabled),
      hostelConfig: hostel?.whatsappConfig || {
        automationEnabled: false,
        rentRemindersEnabled: true,
        paymentReceiptsEnabled: true,
        admissionMessagesEnabled: true,
        announcementsEnabled: true,
      },
      metaStatus: {
        configured: metaConfig.isConfigured,
        tokenConfigured: metaConfig.hasToken,
        phoneNumberIdConfigured: metaConfig.hasPhoneNumberId,
        status: metaConfig.isConfigured ? "Configured" : "Not Configured",
        reason: metaConfig.reason,
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch communication settings");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 2. Update Communication Settings (Global & Hostel Level)
const updateCommunicationSettings = async (req, res) => {
  try {
    const { globalAutomationEnabled, hostelId, hostelConfig } = req.body;

    // SuperAdmin global update
    if (typeof globalAutomationEnabled === "boolean" && (req.user?.role === "super_admin" || req.user?.role === "admin")) {
      await SystemSetting.findOneAndUpdate(
        {},
        { $set: { whatsappAutomationEnabled: globalAutomationEnabled } },
        { upsert: true }
      );
    }

    // Hostel level update
    const targetHostelId = hostelId || req.user?.hostelId;
    if (targetHostelId && hostelConfig) {
      await Hostel.findByIdAndUpdate(targetHostelId, {
        $set: {
          "whatsappConfig.automationEnabled": Boolean(hostelConfig.automationEnabled),
          "whatsappConfig.rentRemindersEnabled": hostelConfig.rentRemindersEnabled !== false,
          "whatsappConfig.paymentReceiptsEnabled": hostelConfig.paymentReceiptsEnabled !== false,
          "whatsappConfig.admissionMessagesEnabled": hostelConfig.admissionMessagesEnabled !== false,
          "whatsappConfig.announcementsEnabled": hostelConfig.announcementsEnabled !== false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "WhatsApp communication settings updated successfully",
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to update communication settings");
    return res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};

// 3. Dispatch Central WhatsApp Message
const sendWhatsApp = async (req, res) => {
  try {
    const {
      hostelId = req.user?.hostelId,
      ownerId = req.user?._id,
      residentId,
      recipientPhone,
      recipientName,
      recipientType = "Resident",
      templateCode = "GENERAL_ANNOUNCEMENT",
      variables = {},
      customMessage,
      businessEvent = "GENERAL",
      referenceId,
    } = req.body;

    if (!recipientPhone) {
      return res.status(400).json({ success: false, message: "Recipient phone number is required" });
    }

    const result = await dispatchWhatsAppMessage({
      hostelId,
      ownerId,
      residentId,
      recipientPhone,
      recipientName,
      recipientType,
      templateCode,
      variables,
      customMessage,
      businessEvent,
      referenceId,
      createdBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to dispatch WhatsApp message");
    return res.status(500).json({ success: false, message: error.message || "Failed to dispatch message" });
  }
};

// 4. Log Manual wa.me Link Click (pending_manual -> manual_opened)
const logManualWhatsAppClick = async (req, res) => {
  try {
    const { communicationId } = req.body;
    const id = communicationId || req.params.id;

    if (!id) {
      return res.status(400).json({ success: false, message: "Communication ID is required" });
    }

    const comm = await Communication.findById(id);
    if (!comm) {
      return res.status(404).json({ success: false, message: "Communication log not found" });
    }

    if (comm.status === "pending_manual") {
      comm.status = "manual_opened";
      comm.openedAt = new Date();
      await comm.save();
    }

    return res.status(200).json({
      success: true,
      communication: comm,
      message: "Manual WhatsApp click logged (status: manual_opened)",
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to log manual WhatsApp click");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 5. Get Communication History
const getCommunications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, mode, hostelId, residentId } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (mode) query.mode = mode;
    if (hostelId) query.hostelId = hostelId;
    if (residentId) query.residentId = residentId;

    // Multitenancy isolation: if owner, restrict query to user's hostelId
    if (req.user?.role === "owner" && req.user?.hostelId) {
      query.hostelId = req.user.hostelId;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const communications = await Communication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("hostelId", "hostelName")
      .populate("residentId", "firstName lastName phone roomNumber")
      .populate("ownerId", "ownerName phone email");

    const total = await Communication.countDocuments(query);

    return res.status(200).json({
      success: true,
      communications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch communications");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 6. Get Default Template Catalog
const getCommunicationTemplates = async (req, res) => {
  try {
    const list = Object.values(TEMPLATES);
    return res.status(200).json({
      success: true,
      templates: list,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load templates" });
  }
};

// 7. Get Pending Operational Action Tasks (Role-Aware Today's Tasks Queue)
const getPendingCommunicationTasks = async (req, res) => {
  try {
    const userRole = req.user?.role || "unknown";
    const isAdmin = ["super_admin", "admin", "eps_admin"].includes(userRole);
    const isOwner = ["owner", "owner_admin", "Warden", "Accountant"].includes(userRole);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to task queue" });
    }

    const query = {
      status: { $in: ["pending_manual", "failed"] },
    };

    if (isOwner && !isAdmin) {
      const ownerHostelId = req.user.hostelId || req.owner?.hostelId;
      if (!ownerHostelId) {
        return res.status(200).json({
          success: true,
          count: 0,
          totalCount: 0,
          categories: { rentRemindersCount: 0, ownerActivationsCount: 0, paymentConfirmationsCount: 0, failedDeliveriesCount: 0 },
          tasks: [],
        });
      }
      query.hostelId = ownerHostelId;
      // Exclude Admin-only platform owner activations from Owner's view
      query.recipientType = { $ne: "Owner" };
      query.templateCode = { $ne: "OWNER_ACCOUNT_ACTIVATED" };
      query.businessEvent = { $ne: "OWNER_ACCOUNT_ACTIVATED" };
    }

    const [tasks, totalCount] = await Promise.all([
      Communication.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("hostelId", "hostelName")
        .populate("residentId", "firstName lastName fullName phone roomNumber")
        .populate("ownerId", "ownerName phone email"),
      Communication.countDocuments(query),
    ]);

    // Compute live categorized breakdown
    let rentRemindersCount = 0;
    let ownerActivationsCount = 0;
    let paymentConfirmationsCount = 0;
    let failedDeliveriesCount = 0;

    tasks.forEach((t) => {
      if (t.status === "failed") {
        failedDeliveriesCount++;
      } else if (t.templateCode === "RENT_REMINDER" || t.businessEvent === "RENT_REMINDER") {
        rentRemindersCount++;
      } else if (t.templateCode === "OWNER_ACCOUNT_ACTIVATED" || t.recipientType === "Owner" || t.businessEvent === "OWNER_ACCOUNT_ACTIVATED") {
        ownerActivationsCount++;
      } else if (t.templateCode === "PAYMENT_RECEIVED" || t.businessEvent === "PAYMENT_RECEIVED") {
        paymentConfirmationsCount++;
      }
    });

    return res.status(200).json({
      success: true,
      count: tasks.length,
      totalCount,
      categories: {
        rentRemindersCount,
        ownerActivationsCount,
        paymentConfirmationsCount,
        failedDeliveriesCount,
      },
      tasks,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch pending communication tasks");
    return res.status(500).json({ success: false, message: "Failed to fetch pending tasks" });
  }
};

// 8. Diagnostics Test Endpoint
const testWhatsAppDiagnostic = async (req, res) => {
  try {
    const { verifyMetaWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");
    const diag = await verifyMetaWhatsAppConfig();
    return res.status(diag.success ? 200 : 502).json(diag);
  } catch (error) {
    return res.status(502).json({ success: false, status: "Verification Failed", message: error.message });
  }
};

// 9. Retry Failed Automatic Message (Max 3 Attempts)
const retryCommunication = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ success: false, message: "Communication ID is required" });
    }

    const comm = await Communication.findById(id);
    if (!comm) {
      return res.status(404).json({ success: false, message: "Communication record not found" });
    }

    // Multitenancy RBAC Check: Owner cannot retry messages for other hostels
    if (req.user?.role === "owner" && req.user?.hostelId && comm.hostelId?.toString() !== req.user.hostelId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Multitenant isolation failure" });
    }

    if (comm.attemptCount >= 3) {
      comm.status = "failed";
      comm.failureReason = "Maximum retry attempts (3) reached. Action required by SuperAdmin.";
      await comm.save();
      return res.status(400).json({
        success: false,
        requires_admin_action: true,
        message: "Maximum retry attempts (3) reached. Action required by Admin.",
        communication: comm,
      });
    }

    // Increment attempt count
    comm.attemptCount = (comm.attemptCount || 1) + 1;
    comm.status = "queued";
    await comm.save();

    // Re-dispatch using whatsappService
    const result = await dispatchWhatsAppMessage({
      hostelId: comm.hostelId,
      residentId: comm.residentId,
      ownerId: comm.ownerId,
      recipientPhone: comm.recipient,
      recipientName: comm.recipientName,
      recipientType: comm.recipientType,
      templateCode: comm.templateCode,
      variables: comm.variables || {},
      customMessage: comm.customMessage,
      businessEvent: comm.businessEvent,
      referenceId: `${comm.referenceId}_RETRY_${comm.attemptCount}`,
      createdBy: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: "Retry dispatched successfully",
      communication: result,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to retry communication");
    return res.status(500).json({ success: false, message: error.message || "Failed to retry communication" });
  }
};

// 10. Get Single Communication Detail (Sanitized Detail Drawer API)
const getCommunicationDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const comm = await Communication.findById(id)
      .populate("hostelId", "hostelName")
      .populate("residentId", "firstName lastName phone roomNumber")
      .populate("ownerId", "ownerName phone email");

    if (!comm) {
      return res.status(404).json({ success: false, message: "Communication log not found" });
    }

    // Tenant isolation check
    if (req.user?.role === "owner" && req.user?.hostelId && comm.hostelId?._id?.toString() !== req.user.hostelId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
    }

    // Sanitize variables & message body: Ensure temporary passwords are never exposed in detail drawer
    const sanitizedComm = comm.toObject();
    const vars = sanitizedComm.metadata?.variables || sanitizedComm.variables;
    if (vars && vars.tempPassword) {
      const origPass = vars.tempPassword;
      vars.tempPassword = "[Controlled Activation Credential]";

      if (typeof sanitizedComm.message === "string" && origPass) {
        sanitizedComm.message = sanitizedComm.message.replaceAll(origPass, "[Controlled Activation Credential]");
      }
      if (typeof sanitizedComm.waMeUrl === "string" && origPass) {
        sanitizedComm.waMeUrl = sanitizedComm.waMeUrl.replaceAll(encodeURIComponent(origPass), "%5BControlled%20Activation%20Credential%5D");
      }
    }
    sanitizedComm.variables = vars || {};

    return res.status(200).json({
      success: true,
      communication: sanitizedComm,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch communication detail");
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// 11. Manual Trigger for Rent Reminder Scan Engine
const triggerManualRentReminderScan = async (req, res) => {
  try {
    const { scanAndDispatchRentReminders } = require("../services/rentReminderService");
    const result = await scanAndDispatchRentReminders();
    return res.status(200).json({
      success: true,
      message: `Rent reminder scan executed. Dispatched ${result.countDispatched || 0} reminders.`,
      result,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Scan failed" });
  }
};

module.exports = {
  getCommunicationSettings,
  updateCommunicationSettings,
  sendWhatsApp,
  logManualWhatsAppClick,
  getCommunications,
  getCommunicationTemplates,
  getPendingCommunicationTasks,
  testWhatsAppDiagnostic,
  retryCommunication,
  getCommunicationDetail,
  triggerManualRentReminderScan,
};
