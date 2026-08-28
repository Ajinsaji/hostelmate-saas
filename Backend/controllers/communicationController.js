"use strict";

const Communication = require("../models/Communication");
const SystemSetting = require("../models/SystemSetting");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Owner = require("../models/Owner");
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

    // Multitenancy RBAC Check: Owner cannot update logs for other hostels
    if (req.user?.role === "owner" && req.user?.hostelId && comm.hostelId?.toString() !== req.user.hostelId.toString()) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied" });
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

const HostelRequest = require("../models/HostelRequest");
const SubscriptionRequest = require("../models/SubscriptionRequest");
const Payment = require("../models/Payment");
const AuditLog = require("../models/AuditLog");

// 7. Get Pending & Completed Operational Action Tasks (Today's Operational Activity)
const getPendingCommunicationTasks = async (req, res) => {
  try {
    const userRole = req.user?.role || req.admin?.role || "unknown";
    const isAdmin = ["super_admin", "admin", "eps_admin"].includes(userRole);
    const isOwner = ["owner", "owner_admin", "Warden", "Accountant"].includes(userRole);

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to task queue" });
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const commQuery = {
      status: { $in: ["pending_manual", "failed"] },
    };

    let ownerHostelId = null;
    if (isOwner && !isAdmin) {
      ownerHostelId = req.user.hostelId || req.owner?.hostelId;
      if (!ownerHostelId) {
        return res.status(200).json({
          success: true,
          concept: "Today's operational activity — pending work and completed Admin actions",
          count: 0,
          totalCount: 0,
          pendingCount: 0,
          completedCount: 0,
          categories: {
            rentRemindersCount: 0,
            ownerActivationsCount: 0,
            paymentConfirmationsCount: 0,
            failedDeliveriesCount: 0,
            pendingRegistrationsCount: 0,
            pendingActivationsCount: 0,
            pendingSubscriptionsCount: 0,
            pendingPaymentsCount: 0,
            completedTodayCount: 0,
          },
          pendingTasks: [],
          completedTasksToday: [],
          tasks: [],
        });
      }
      commQuery.hostelId = ownerHostelId;
      // Exclude Admin-only platform owner activations from Owner's view
      commQuery.recipientType = { $ne: "Owner" };
      commQuery.templateCode = { $ne: "OWNER_ACCOUNT_ACTIVATED" };
      commQuery.businessEvent = { $ne: "OWNER_ACCOUNT_ACTIVATED" };
    }

    // 1. PENDING QUERIES
    const commTasksPromise = Communication.find(commQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("hostelId", "hostelName")
      .populate("residentId", "firstName lastName fullName phone roomNumber")
      .populate("ownerId", "ownerName phone email")
      .lean();

    const pendingRequestsPromise = isAdmin
      ? HostelRequest.find({ status: "pending" }).sort({ createdAt: -1 }).limit(30).lean()
      : Promise.resolve([]);

    const pendingActivationsPromise = isAdmin
      ? HostelRequest.find({ status: "activation_pending" }).sort({ updatedAt: -1 }).limit(30).lean()
      : Promise.resolve([]);

    const pendingSubscriptionsPromise = isAdmin
      ? SubscriptionRequest.find({ status: "pending" }).sort({ createdAt: -1 }).limit(30).populate("hostelId", "hostelName").lean()
      : Promise.resolve([]);

    const pendingPaymentsPromise = isAdmin
      ? Payment.find({ status: { $in: ["Pending", "pending"] } }).sort({ createdAt: -1 }).limit(30).populate("hostelId", "hostelName").lean()
      : Promise.resolve([]);

    // 2. COMPLETED TODAY QUERIES (timestamp >= startOfToday)
    const approvedRequestsTodayPromise = isAdmin
      ? HostelRequest.find({ status: { $in: ["activation_pending", "approved", "activated"] }, updatedAt: { $gte: startOfToday } })
          .sort({ updatedAt: -1 })
          .limit(30)
          .lean()
      : Promise.resolve([]);

    const rejectedRequestsTodayPromise = isAdmin
      ? HostelRequest.find({ status: "rejected", updatedAt: { $gte: startOfToday } })
          .sort({ updatedAt: -1 })
          .limit(30)
          .lean()
      : Promise.resolve([]);

    const finalizedActivationsTodayPromise = isAdmin
      ? Hostel.find({ pendingActivation: false, isDeleted: { $ne: true }, activatedAt: { $gte: startOfToday } })
          .sort({ activatedAt: -1 })
          .limit(30)
          .lean()
      : Promise.resolve([]);

    const manualWhatsAppTodayPromise = Communication.find(
      isOwner && !isAdmin
        ? { hostelId: ownerHostelId, status: "manual_opened", openedAt: { $gte: startOfToday } }
        : { status: "manual_opened", openedAt: { $gte: startOfToday } }
    )
      .sort({ openedAt: -1 })
      .limit(30)
      .populate("hostelId", "hostelName")
      .lean();

    const retriedWhatsAppTodayPromise = Communication.find(
      isOwner && !isAdmin
        ? { hostelId: ownerHostelId, attemptCount: { $gt: 1 }, updatedAt: { $gte: startOfToday } }
        : { attemptCount: { $gt: 1 }, updatedAt: { $gte: startOfToday } }
    )
      .sort({ updatedAt: -1 })
      .limit(30)
      .populate("hostelId", "hostelName")
      .lean();

    const auditLogsTodayPromise = isAdmin
      ? AuditLog.find({ timestamp: { $gte: startOfToday } })
          .sort({ timestamp: -1 })
          .limit(50)
          .populate("hostelId", "hostelName")
          .lean()
      : Promise.resolve([]);

    const AdminTaskDismissal = require("../models/AdminTaskDismissal");
    const currentAdminId = req.user?._id || req.user?.id || req.userId || req.admin?._id;

    const dismissalsPromise = currentAdminId
      ? AdminTaskDismissal.find({ adminId: currentAdminId }).select("taskId communicationId").lean()
      : Promise.resolve([]);

    const [
      commTasks,
      pendingRequests,
      pendingActivations,
      pendingSubscriptions,
      pendingPayments,
      approvedRequestsToday,
      rejectedRequestsToday,
      finalizedActivationsToday,
      manualWhatsAppToday,
      retriedWhatsAppToday,
      auditLogsToday,
      dismissedRecords,
    ] = await Promise.all([
      commTasksPromise,
      pendingRequestsPromise,
      pendingActivationsPromise,
      pendingSubscriptionsPromise,
      pendingPaymentsPromise,
      approvedRequestsTodayPromise,
      rejectedRequestsTodayPromise,
      finalizedActivationsTodayPromise,
      manualWhatsAppTodayPromise,
      retriedWhatsAppTodayPromise,
      auditLogsTodayPromise,
      dismissalsPromise,
    ]);

    const dismissedIdsSet = new Set();
    (dismissedRecords || []).forEach((d) => {
      if (d.taskId) dismissedIdsSet.add(String(d.taskId));
      if (d.communicationId) dismissedIdsSet.add(String(d.communicationId));
    });

    // Compute live categorized counts
    let rentRemindersCount = 0;
    let ownerActivationsCount = 0;
    let paymentConfirmationsCount = 0;
    let failedDeliveriesCount = 0;

    commTasks.forEach((t) => {
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

    const pendingRegistrationsCount = pendingRequests.length;
    const pendingActivationsCount = pendingActivations.length;
    const pendingSubscriptionsCount = pendingSubscriptions.length;
    const pendingPaymentsCount = pendingPayments.length;

    // Build Formatted Pending Tasks List
    const formattedPendingTasks = [];
    const pushPendingItem = (item) => {
      const isDismissed =
        dismissedIdsSet.has(String(item.id)) ||
        (item.dbId && dismissedIdsSet.has(String(item.dbId)));
      if (!isDismissed) {
        formattedPendingTasks.push(item);
      }
    };

    // 1. Pending Hostel Registrations
    pendingRequests.forEach((reqItem) => {
      pushPendingItem({
        id: `req_${reqItem._id}`,
        dbId: reqItem._id,
        type: "registration_pending",
        category: "registration",
        title: "New hostel registration awaiting review",
        subtitle: `${reqItem.hostelName || "Hostel"} • Owner: ${reqItem.ownerName || "Applicant"}`,
        hostelName: reqItem.hostelName,
        recipientName: reqItem.ownerName,
        phone: reqItem.phone,
        status: "pending",
        badge: "Needs Review",
        badgeColor: "rose",
        timestamp: reqItem.createdAt,
        actionType: "review_registration",
        actionUrl: "/admin/requests",
        raw: reqItem,
      });
    });

    // 2. Pending Activations
    pendingActivations.forEach((actItem) => {
      pushPendingItem({
        id: `act_${actItem._id}`,
        dbId: actItem._id,
        type: "activation_pending",
        category: "activation",
        title: "Activation pending — Final subscription & credentials setup",
        subtitle: `${actItem.hostelName || "Hostel"} • Owner: ${actItem.ownerName || "Owner"}`,
        hostelName: actItem.hostelName,
        recipientName: actItem.ownerName,
        phone: actItem.phone,
        status: "activation_pending",
        badge: "Activation Pending",
        badgeColor: "amber",
        timestamp: actItem.updatedAt || actItem.createdAt,
        actionType: "finalize_activation",
        actionUrl: "/admin/requests",
        raw: actItem,
      });
    });

    // 3. Pending WhatsApp Dispatches & Failed Retries
    commTasks.forEach((commItem) => {
      const isFailed = commItem.status === "failed";
      const isManual = commItem.status === "pending_manual";

      let taskTitle = "WhatsApp message awaiting manual send";
      let badge = "Manual WhatsApp";
      let badgeColor = "emerald";

      if (isFailed) {
        taskTitle = `Failed WhatsApp delivery (Attempt ${commItem.attemptCount || 1}/3)`;
        badge = "Failed Delivery";
        badgeColor = "rose";
      } else if (commItem.templateCode === "RENT_REMINDER" || commItem.businessEvent === "RENT_REMINDER") {
        taskTitle = "Rent reminder WhatsApp awaiting manual send";
        badge = "Rent Reminder";
        badgeColor = "rose";
      } else if (commItem.templateCode === "OWNER_ACCOUNT_ACTIVATED" || commItem.recipientType === "Owner" || commItem.businessEvent === "OWNER_ACCOUNT_ACTIVATED") {
        taskTitle = "Owner activation credentials WhatsApp awaiting send";
        badge = "Owner Activation";
        badgeColor = "amber";
      } else if (commItem.templateCode === "PAYMENT_RECEIVED" || commItem.businessEvent === "PAYMENT_RECEIVED") {
        taskTitle = "Payment receipt WhatsApp awaiting send";
        badge = "Payment Receipt";
        badgeColor = "yellow";
      }

      pushPendingItem({
        id: String(commItem._id),
        dbId: commItem._id,
        type: isFailed ? "whatsapp_failed" : "whatsapp_manual",
        category: "whatsapp",
        title: taskTitle,
        subtitle: `${commItem.recipientName || "Resident"} (${commItem.recipient || "Phone"}) • ${commItem.hostelId?.hostelName || "Hostel"}`,
        hostelName: commItem.hostelId?.hostelName,
        recipientName: commItem.recipientName,
        phone: commItem.recipient,
        templateCode: commItem.templateCode,
        businessEvent: commItem.businessEvent,
        waMeUrl: commItem.waMeUrl,
        message: commItem.message,
        attemptCount: commItem.attemptCount || 0,
        failureReason: commItem.failureReason,
        status: commItem.status,
        badge,
        badgeColor,
        timestamp: commItem.createdAt,
        actionType: isFailed ? "retry_whatsapp" : "open_whatsapp",
        actionUrl: "/admin/tasks",
        raw: commItem,
      });
    });

    // 4. Pending Subscription Requests
    pendingSubscriptions.forEach((subItem) => {
      pushPendingItem({
        id: `sub_${subItem._id}`,
        dbId: subItem._id,
        type: "subscription_pending",
        category: "subscription",
        title: "Subscription continuation request awaiting review",
        subtitle: `${subItem.hostelId?.hostelName || subItem.hostelName || "Hostel"} • Plan: ${subItem.planType || "Pro"}`,
        hostelName: subItem.hostelId?.hostelName || subItem.hostelName,
        recipientName: subItem.ownerName,
        phone: subItem.phone,
        status: "pending",
        badge: "Subscription Request",
        badgeColor: "purple",
        timestamp: subItem.createdAt,
        actionType: "approve_subscription",
        actionUrl: "/admin/subscriptions",
        raw: subItem,
      });
    });

    // 5. Pending Payments
    pendingPayments.forEach((payItem) => {
      pushPendingItem({
        id: `pay_${payItem._id}`,
        dbId: payItem._id,
        type: "payment_pending",
        category: "payment",
        title: "Payment confirmation awaiting action",
        subtitle: `Amount: ₹${payItem.amount || 0} • ${payItem.hostelId?.hostelName || "Hostel"}`,
        hostelName: payItem.hostelId?.hostelName,
        status: "Pending",
        badge: "Payment Confirmation",
        badgeColor: "yellow",
        timestamp: payItem.createdAt,
        actionType: "verify_payment",
        actionUrl: "/admin/revenue",
        raw: payItem,
      });
    });

    // Build Formatted Completed Today List
    const formattedCompletedToday = [];
    const seenActionIds = new Set();

    // Helper to push deduplicated completed items (filtering out any dismissed tasks)
    const pushCompletedItem = (item) => {
      const isDismissed =
        dismissedIdsSet.has(String(item.id)) ||
        (item.dbId && dismissedIdsSet.has(String(item.dbId)));

      if (!isDismissed && !seenActionIds.has(item.id)) {
        seenActionIds.add(item.id);
        formattedCompletedToday.push(item);
      }
    };

    // 1. Approved Registrations Today
    approvedRequestsToday.forEach((reqItem) => {
      pushCompletedItem({
        id: `done_app_${reqItem._id}`,
        dbId: reqItem._id,
        type: "approved_registration",
        category: "registration",
        title: "Approved hostel registration",
        subtitle: `${reqItem.hostelName || "Hostel"} • Owner: ${reqItem.ownerName || "Applicant"}`,
        hostelName: reqItem.hostelName,
        recipientName: reqItem.ownerName,
        status: "completed",
        badge: "Approved",
        badgeColor: "emerald",
        timestamp: reqItem.updatedAt || reqItem.createdAt,
        details: "Hostel registration approved and transitioned to activation pending.",
        actionUrl: "/admin/requests",
        raw: reqItem,
      });
    });

    // 2. Rejected Registrations Today
    rejectedRequestsToday.forEach((reqItem) => {
      pushCompletedItem({
        id: `done_rej_${reqItem._id}`,
        dbId: reqItem._id,
        type: "rejected_registration",
        category: "registration",
        title: "Rejected registration",
        subtitle: `${reqItem.hostelName || "Hostel"} • Reason: ${reqItem.rejectionReason || "Requirements not met"}`,
        hostelName: reqItem.hostelName,
        recipientName: reqItem.ownerName,
        status: "rejected",
        badge: "Rejected",
        badgeColor: "rose",
        timestamp: reqItem.updatedAt || reqItem.createdAt,
        details: reqItem.rejectionReason || "Application rejected by SuperAdmin.",
        actionUrl: "/admin/requests",
        raw: reqItem,
      });
    });

    // 3. Finalized Activations Today
    finalizedActivationsToday.forEach((actHostel) => {
      pushCompletedItem({
        id: `done_act_${actHostel._id}`,
        dbId: actHostel._id,
        type: "finalized_activation",
        category: "activation",
        title: "Finalized hostel activation",
        subtitle: `${actHostel.hostelName || actHostel.name || "Hostel"} • Public Code: ${actHostel.publicCode || "Active"}`,
        hostelName: actHostel.hostelName || actHostel.name,
        recipientName: actHostel.ownerName,
        status: "activated",
        badge: "Activated",
        badgeColor: "emerald",
        timestamp: actHostel.activatedAt || actHostel.updatedAt,
        details: "Hostel fully activated, subscription provisioned, and owner account unlocked.",
        actionUrl: "/admin/hostels",
        raw: actHostel,
      });
    });

    // 4. Sent Manual WhatsApp Today
    manualWhatsAppToday.forEach((commItem) => {
      pushCompletedItem({
        id: `done_wame_${commItem._id}`,
        dbId: commItem._id,
        type: "manual_whatsapp_sent",
        category: "whatsapp",
        title: "Sent manual WhatsApp",
        subtitle: `${commItem.recipientName || "Recipient"} (${commItem.recipient || "Phone"}) • ${commItem.templateCode || commItem.businessEvent || "Message"}`,
        hostelName: commItem.hostelId?.hostelName,
        recipientName: commItem.recipientName,
        phone: commItem.recipient,
        status: "manual_opened",
        badge: "Dispatched",
        badgeColor: "emerald",
        timestamp: commItem.openedAt || commItem.updatedAt,
        details: "Manual WhatsApp message link opened and logged for delivery.",
        actionUrl: "/admin/tasks",
        raw: commItem,
      });
    });

    // 5. Retried WhatsApp Today
    retriedWhatsAppToday.forEach((commItem) => {
      pushCompletedItem({
        id: `done_retry_${commItem._id}`,
        dbId: commItem._id,
        type: "retried_whatsapp",
        category: "whatsapp",
        title: `Retried failed WhatsApp (Attempt ${commItem.attemptCount})`,
        subtitle: `${commItem.recipientName || "Recipient"} (${commItem.recipient || "Phone"})`,
        hostelName: commItem.hostelId?.hostelName,
        recipientName: commItem.recipientName,
        phone: commItem.recipient,
        status: commItem.status,
        badge: "Retried",
        badgeColor: "blue",
        timestamp: commItem.updatedAt,
        details: `Automatic retry executed (Attempt ${commItem.attemptCount}/3).`,
        actionUrl: "/admin/tasks",
        raw: commItem,
      });
    });

    // 6. Audit Logs Today (Restores from Trash, Owner Suspensions, Password Resets, Subscription Extensions, Payments)
    auditLogsToday.forEach((log) => {
      let actionTitle = "Admin operational action completed";
      let badge = "Audit Log";
      let badgeColor = "indigo";
      let category = "system";

      const action = log.action || "";
      if (action.includes("RESTORE")) {
        actionTitle = "Restored hostel from Trash";
        badge = "Restored";
        badgeColor = "blue";
        category = "hostel";
      } else if (action.includes("SUSPEND") || (action.includes("OWNER_STATUS") && log.details?.status === "suspended")) {
        actionTitle = "Suspended owner";
        badge = "Suspended";
        badgeColor = "rose";
        category = "security";
      } else if (action.includes("RESET") && action.includes("PASSWORD")) {
        actionTitle = "Reset owner password";
        badge = "Password Reset";
        badgeColor = "indigo";
        category = "security";
      } else if (action.includes("EXTEND") || action.includes("SUBSCRIPTION")) {
        actionTitle = "Extended subscription / approved continuation";
        badge = "Extended";
        badgeColor = "purple";
        category = "subscription";
      } else if (action.includes("PAYMENT")) {
        actionTitle = "Recorded payment";
        badge = "Paid";
        badgeColor = "emerald";
        category = "payment";
      } else if (action.includes("APPROVE")) {
        actionTitle = "Approved hostel registration";
        badge = "Approved";
        badgeColor = "emerald";
        category = "registration";
      } else if (action.includes("ACTIVAT")) {
        actionTitle = "Finalized hostel activation";
        badge = "Activated";
        badgeColor = "emerald";
        category = "activation";
      }

      pushCompletedItem({
        id: `audit_${log._id}`,
        dbId: log._id,
        type: action.toLowerCase() || "admin_audit",
        category,
        title: actionTitle,
        subtitle: log.details?.message || log.details?.hostelName || log.details?.ownerName || log.action || "Completed admin task",
        hostelName: log.hostelId?.hostelName || log.details?.hostelName,
        status: "completed",
        badge,
        badgeColor,
        timestamp: log.timestamp || log.createdAt,
        details: log.details?.message || typeof log.details === "string" ? log.details : JSON.stringify(log.details || {}),
        actionUrl: "/admin/audit",
        raw: log,
      });
    });

    const pendingCount = formattedPendingTasks.length;
    const completedTodayCount = formattedCompletedToday.length;
    const totalActivityCount = pendingCount + completedTodayCount;

    return res.status(200).json({
      success: true,
      concept: "Today's operational activity — pending work and completed Admin actions",
      summary: {
        pendingCount,
        completedTodayCount,
        totalActivityCount,
      },
      count: commTasks.length, // Backward compatibility for test suites
      totalCount: totalActivityCount,
      pendingCount,
      completedCount: completedTodayCount,
      completedTodayCount,
      categories: {
        rentRemindersCount,
        ownerActivationsCount,
        paymentConfirmationsCount,
        failedDeliveriesCount,
        pendingRegistrationsCount,
        pendingActivationsCount,
        pendingSubscriptionsCount,
        pendingPaymentsCount,
        completedTodayCount,
      },
      pendingTasks: formattedPendingTasks,
      completedTasksToday: formattedCompletedToday,
      tasks: commTasks, // Backward compatibility for test suites
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to fetch today's tasks and operational activity");
    return res.status(500).json({ success: false, message: "Failed to fetch today's tasks" });
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

    // Re-dispatch using whatsappService with fresh credentials if activation message
    let retryVars = { ...(comm.variables || {}) };
    if (comm.templateCode === "OWNER_ACCOUNT_ACTIVATED" && comm.ownerId) {
      const Owner = require("../models/Owner");
      const bcrypt = require("bcryptjs");
      const newTempPassword = `HM${Math.floor(1000 + Math.random() * 9000)}@${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10 + Math.random() * 90)}`;
      const owner = await Owner.findById(comm.ownerId);
      if (owner) {
        owner.password = await bcrypt.hash(newTempPassword, 10);
        owner.mustChangePassword = true;
        owner.firstLogin = true;
        owner.credentialIssuedAt = new Date();
        await owner.save();
        retryVars.tempPassword = newTempPassword;
      }
    }

    const result = await dispatchWhatsAppMessage({
      hostelId: comm.hostelId,
      residentId: comm.residentId,
      ownerId: comm.ownerId,
      recipientPhone: comm.recipient,
      recipientName: comm.recipientName,
      recipientType: comm.recipientType,
      templateCode: comm.templateCode,
      variables: retryVars,
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
  getAdminTodayTasks: getPendingCommunicationTasks,
  testWhatsAppDiagnostic,
  retryCommunication,
  getCommunicationDetail,
  triggerManualRentReminderScan,
};
