"use strict";

const axios = require("axios");
const mongoose = require("mongoose");
const Communication = require("../models/Communication");
const SystemSetting = require("../models/SystemSetting");
const Hostel = require("../models/Hostel");
const { logger } = require("../utils/logger");
const { sendOwnerWhatsApp, validateWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");

const CONTROLLED_ACTIVATION_CREDENTIAL = "[Controlled Activation Credential]";

// Normalize phone to E.164-like with country code for India (no leading +)
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;
  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits.replace(/^0+/, "");
  if (normalized.startsWith("91")) {
    if (normalized.length !== 12) return null;
    return normalized;
  }
  if (normalized.length === 10) {
    return `91${normalized}`;
  }
  return null;
};

// Build encoded wa.me URL
const buildWaMeUrl = (phone, messageText) => {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return null;
  const encodedText = encodeURIComponent(messageText || "");
  return `https://wa.me/${normalized}?text=${encodedText}`;
};

// Default Templates Library
const TEMPLATES = {
  RENT_REMINDER: {
    templateCode: "RENT_REMINDER",
    name: "Rent Due Reminder",
    category: "rent",
    defaultText:
      "Hi {{residentName}},\n\nYour hostel rent of INR {{amount}} for {{month}} is due on {{dueDate}}.\n\nHostel: {{hostelName}}\nRoom: {{roomNumber}}\n\nThank you.",
    variables: ["residentName", "amount", "month", "dueDate", "hostelName", "roomNumber"],
  },
  PAYMENT_RECEIVED: {
    templateCode: "PAYMENT_RECEIVED",
    name: "Payment Receipt Confirmation",
    category: "rent",
    defaultText:
      "Hi {{residentName}},\n\nWe have received your rent payment of INR {{amount}} for {{month}}.\nRemaining Balance: INR {{balance}}.\n\nHostel: {{hostelName}}\nReceipt #: {{receiptNo}}.\n\nThank you!",
    variables: ["residentName", "amount", "month", "balance", "hostelName", "receiptNo"],
  },
  ADMISSION_SUBMITTED: {
    templateCode: "ADMISSION_SUBMITTED",
    name: "Admission Application Received",
    category: "admission",
    defaultText:
      "Hello {{applicantName}},\n\nYour admission application for \"{{hostelName}}\" has been received successfully.\n\nApplication ID: {{referenceId}}\nDate: {{submissionDate}}\nStatus: {{status}}\n\nThe hostel management will review your application shortly.\n\nThank you,\nHostelMate",
    variables: ["applicantName", "hostelName", "referenceId", "submissionDate", "status"],
  },
  ADMISSION_APPROVED: {
    templateCode: "ADMISSION_APPROVED",
    name: "Admission Approval & Welcome",
    category: "admission",
    defaultText:
      "Dear {{residentName}},\n\nYour admission request for {{hostelName}} has been APPROVED! 🎉\n\nRoom Allocated: {{roomNumber}}\nBed: {{bedNumber}}\n\nWelcome to {{hostelName}}!",
    variables: ["residentName", "hostelName", "roomNumber", "bedNumber"],
  },
  ADMISSION_REJECTED: {
    templateCode: "ADMISSION_REJECTED",
    name: "Admission Application Status Update",
    category: "admission",
    defaultText:
      "Hello {{applicantName}},\n\nYour admission application for \"{{hostelName}}\" has been reviewed.\n\nApplication ID: {{referenceId}}\nStatus: Rejected\nReason: {{rejectionReason}}\n\nFor further clarification, please contact the hostel.\n\nThank you,\nHostelMate",
    variables: ["applicantName", "hostelName", "referenceId", "rejectionReason"],
  },
  ROOM_TRANSFERRED: {
    templateCode: "ROOM_TRANSFERRED",
    name: "Room Transfer Notice",
    category: "admission",
    defaultText:
      "Hello {{residentName}},\n\nYour room has been changed at {{hostelName}}.\n\nPrevious:\nRoom {{oldRoom}}, Bed {{oldBed}}\n\nNew:\nRoom {{newRoom}}, Bed {{newBed}}\n\nThank you,\nHostelMate",
    variables: ["residentName", "hostelName", "oldRoom", "oldBed", "newRoom", "newBed"],
  },
  ROOM_ASSIGNED: {
    templateCode: "ROOM_ASSIGNED",
    name: "Room & Bed Allocation",
    category: "admission",
    defaultText:
      "Hello {{residentName}},\n\nYou have been assigned Room {{roomNumber}}, Bed {{bedNumber}} at {{hostelName}}.\n\nMonthly Rent: INR {{monthlyRent}}.",
    variables: ["residentName", "roomNumber", "bedNumber", "hostelName", "monthlyRent"],
  },
  CHECKOUT_CLEARANCE: {
    templateCode: "CHECKOUT_CLEARANCE",
    name: "Check-Out Clearance Notice",
    category: "resident",
    defaultText:
      "Hello {{residentName}},\n\nYour check-out from {{hostelName}} has been processed. Actual Checkout Date: {{actualCheckoutDate}}.\n\nThank you for staying with us!",
    variables: ["residentName", "hostelName", "actualCheckoutDate"],
  },
  OWNER_ACCOUNT_ACTIVATED: {
    templateCode: "OWNER_ACCOUNT_ACTIVATED",
    name: "Owner Account Activation & Credentials",
    category: "announcement",
    defaultText:
      "🎉 Welcome to HostelMate\n\nHello {{ownerName}},\n\nYour hostel \"{{hostelName}}\" has been successfully activated.\n\n🔐 Login Details\nUsername: {{username}}\nTemporary Password: {{tempPassword}}\n\n📦 Subscription: {{planType}}\n🎁 Trial Period: {{trialDays}} Days Free\n\n📅 Trial Start Date: {{trialStartDate}}\n📅 Trial End Date: {{trialEndDate}}\n\n💰 Subscription Details\nTrial Amount: ₹{{trialAmount}}\nSubscription Amount: ₹{{subscriptionAmount}} / {{billingCycle}}\n\n📅 Expiry Date: {{expiryDate}}\n\n🔗 Login:\n{{loginUrl}}\n\n⚠️ Please change your password immediately after login.\n\nThank you for choosing HostelMate ❤️",
    variables: [
      "ownerName",
      "hostelName",
      "username",
      "tempPassword",
      "planType",
      "trialDays",
      "trialStartDate",
      "trialEndDate",
      "trialAmount",
      "subscriptionAmount",
      "billingCycle",
      "expiryDate",
      "loginUrl",
    ],
  },
  HOSTEL_ACTIVATED_FOR_EXISTING_OWNER: {
    templateCode: "HOSTEL_ACTIVATED_FOR_EXISTING_OWNER",
    name: "New Hostel Approved (Existing Owner)",
    category: "announcement",
    defaultText:
      "🎉 New Hostel Approved\n\nHello {{ownerName}},\n\nYour new hostel \"{{hostelName}}\" has been approved and activated on HostelMate.\n\n🏠 Hostel: {{hostelName}}\n📍 Location: {{location}}\n🛏 Rooms: {{rooms}}\n🛏 Beds: {{beds}}\n📅 Activated: {{activationDate}}\n\nYou can switch to your new hostel from the HostelMate dashboard.\n\n🔗 Login:\n{{loginUrl}}\n\nYour existing owner account remains unchanged.\n\nThank you,\nHostelMate ❤️",
    variables: ["ownerName", "hostelName", "location", "rooms", "beds", "activationDate", "loginUrl"],
  },
  GENERAL_ANNOUNCEMENT: {
    templateCode: "GENERAL_ANNOUNCEMENT",
    name: "General Announcement",
    category: "announcement",
    defaultText: "Notice from {{hostelName}} Management:\n\n{{customMessage}}",
    variables: ["hostelName", "customMessage"],
  },
};

// Safe date formatter for template dates
const formatExpiryDate = (d) => {
  if (!d) return "";
  try {
    const dt = new Date(d);
    if (isNaN(dt.getTime())) return String(d);
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  } catch {
    return String(d);
  }
};

// Compile Handlebars-style template variables
const compileTemplate = (templateCode, variablesDict = {}, customText = null) => {
  let text = customText;
  const tpl = TEMPLATES[templateCode] || TEMPLATES.GENERAL_ANNOUNCEMENT;
  if (!text) {
    text = tpl.defaultText;
  }

  const safeVars = { ...variablesDict };
  if (safeVars.temporaryPassword === undefined && safeVars.tempPassword !== undefined) {
    safeVars.temporaryPassword = safeVars.tempPassword;
  }
  if (safeVars.temporaryPassword !== undefined) {
    safeVars.tempPassword = safeVars.temporaryPassword;
  }
  if (templateCode === "OWNER_ACCOUNT_ACTIVATED") {
    if (!safeVars.planType || safeVars.planType === "Pro" || safeVars.planType === "Basic" || safeVars.planType === "Enterprise") {
      safeVars.planType = "HostelMate Unified Plan";
    }
    safeVars.trialStartDate = formatExpiryDate(safeVars.trialStartDate || safeVars.startDate || new Date());
    safeVars.trialEndDate = formatExpiryDate(safeVars.trialEndDate || safeVars.endDate || safeVars.expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    safeVars.expiryDate = safeVars.expiryDate ? formatExpiryDate(safeVars.expiryDate) : safeVars.trialEndDate;
    safeVars.trialDays = safeVars.trialDays !== undefined && safeVars.trialDays !== null ? safeVars.trialDays : "30";
    safeVars.trialAmount = safeVars.trialAmount !== undefined && safeVars.trialAmount !== null ? safeVars.trialAmount : "0";
    safeVars.subscriptionAmount = safeVars.subscriptionAmount !== undefined && safeVars.subscriptionAmount !== null ? safeVars.subscriptionAmount : (safeVars.amount || "10");
    safeVars.billingCycle = safeVars.billingCycle || "Month";
    if (!safeVars.loginUrl) {
      safeVars.loginUrl = "https://hostelmate-saas.vercel.app/owner/login";
    }
  } else if (templateCode === "RENT_REMINDER") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.amount = safeVars.amount || "0";
    safeVars.month = safeVars.month || "Current Month";
    safeVars.dueDate = safeVars.dueDate || "Due Date";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.roomNumber = safeVars.roomNumber || "-";
  } else if (templateCode === "PAYMENT_RECEIVED") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.amount = safeVars.amount || "0";
    safeVars.month = safeVars.month || "Current Month";
    safeVars.balance = safeVars.balance || "0";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.receiptNo = safeVars.receiptNo || "REC-001";
  } else if (templateCode === "ADMISSION_SUBMITTED") {
    safeVars.applicantName = safeVars.applicantName || "Applicant";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.referenceId = safeVars.referenceId || safeVars.admissionId || "-";
    safeVars.submissionDate = safeVars.submissionDate || new Date().toLocaleDateString();
    safeVars.status = safeVars.status || "Pending";
  } else if (templateCode === "ADMISSION_APPROVED") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.roomNumber = safeVars.roomNumber || "-";
    safeVars.bedNumber = safeVars.bedNumber || "-";
  } else if (templateCode === "ADMISSION_REJECTED") {
    safeVars.applicantName = safeVars.applicantName || "Applicant";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.referenceId = safeVars.referenceId || safeVars.admissionId || "-";
    safeVars.rejectionReason = safeVars.rejectionReason || "Not specified";
  } else if (templateCode === "ROOM_TRANSFERRED") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.oldRoom = safeVars.oldRoom || "—";
    safeVars.oldBed = safeVars.oldBed || "—";
    safeVars.newRoom = safeVars.newRoom || "—";
    safeVars.newBed = safeVars.newBed || "—";
  } else if (templateCode === "ROOM_ASSIGNED") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.roomNumber = safeVars.roomNumber || "-";
    safeVars.bedNumber = safeVars.bedNumber || "-";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.monthlyRent = safeVars.monthlyRent || "0";
  } else if (templateCode === "CHECKOUT_CLEARANCE") {
    safeVars.residentName = safeVars.residentName || "Resident";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.actualCheckoutDate = safeVars.actualCheckoutDate || "Today";
  } else if (templateCode === "HOSTEL_ACTIVATED_FOR_EXISTING_OWNER") {
    safeVars.ownerName = safeVars.ownerName || "Owner";
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.location = safeVars.location || (safeVars.city ? `${safeVars.city}, ${safeVars.district || ""}`.trim() : "Property Location");
    safeVars.rooms = safeVars.rooms || "0";
    safeVars.beds = safeVars.beds || "0";
    safeVars.activationDate = safeVars.activationDate || new Date().toLocaleDateString();
    safeVars.loginUrl = safeVars.loginUrl || "https://hostelmate-saas.vercel.app/owner/login";
  } else if (templateCode === "GENERAL_ANNOUNCEMENT") {
    safeVars.hostelName = safeVars.hostelName || "Hostel";
    safeVars.customMessage = safeVars.customMessage || safeVars.message || "Important Announcement";
  }

  let compiled = text;
  // Replace all {{varName}} dynamically from safeVars or fallback to "-"
  compiled = compiled.replace(/{{\s*([\w.-]+)\s*}}/g, (_, key) => {
    const val = safeVars[key];
    if (val !== undefined && val !== null) {
      return String(val);
    }
    return "-";
  });

  return compiled;
};

/**
 * Precedence Engine:
 * Global OFF -> Manual Mode
 * User WhatsApp Preference OFF -> Manual Mode
 * Global ON + Hostel OFF -> Manual Mode
 * Global ON + Hostel ON + Message Type OFF -> Manual Mode
 * Global ON + Hostel ON + Message Type ON -> Automatic Mode
 */
const resolveAutomationMode = async (hostelId = null, category = "rent", recipientUserId = null) => {
  try {
    const systemSettings = await SystemSetting.findOne().lean();
    const globalEnabled = Boolean(systemSettings?.whatsappAutomationEnabled);

    if (!globalEnabled) {
      return { mode: "manual_wame", isAutomatic: false, reason: "Global WhatsApp Automation is OFF" };
    }

    if (recipientUserId) {
      const NotificationSetting = require("../models/NotificationSetting");
      const userSettings = await NotificationSetting.findOne({ userId: recipientUserId }).lean();
      if (userSettings && userSettings.whatsappNotifications === false) {
        return { mode: "manual_wame", isAutomatic: false, reason: "User has disabled WhatsApp notifications" };
      }
    }

    if (!hostelId) {
      return { mode: "manual_wame", isAutomatic: false, reason: "No Hostel context provided" };
    }

    const hostel = await Hostel.findById(hostelId).lean();
    if (!hostel) {
      return { mode: "manual_wame", isAutomatic: false, reason: "Hostel not found" };
    }

    const cfg = hostel.whatsappConfig || {};
    const hostelEnabled = Boolean(cfg.automationEnabled);

    if (!hostelEnabled) {
      return { mode: "manual_wame", isAutomatic: false, reason: "Hostel WhatsApp Automation is OFF" };
    }

    const cat = (category || "").toLowerCase();
    let typeEnabled = true;

    if (cat === "rent") {
      typeEnabled = cfg.rentRemindersEnabled !== false;
    } else if (cat === "payment") {
      typeEnabled = cfg.paymentReceiptsEnabled !== false;
    } else if (cat === "admission") {
      typeEnabled = cfg.admissionMessagesEnabled !== false;
    } else if (cat === "announcement") {
      typeEnabled = cfg.announcementsEnabled !== false;
    }

    if (!typeEnabled) {
      return { mode: "manual_wame", isAutomatic: false, reason: `Message category '${category}' is disabled for this hostel` };
    }

    return { mode: "meta_api", isAutomatic: true, reason: "Automation Enabled (Global ON + Hostel ON)" };
  } catch (err) {
    logger.error({ err }, "Error resolving automation mode precedence. Defaulting to manual_wame.");
    return { mode: "manual_wame", isAutomatic: false, reason: "Precedence resolution error" };
  }
};

// Idempotency Check: Prevents duplicate dispatches for same event reference
const checkIdempotency = async (hostelId, templateCode, referenceId) => {
  if (!referenceId) return false;
  const existing = await Communication.findOne({
    hostelId,
    templateCode,
    referenceId,
    status: { $in: ["pending_manual", "manual_opened", "queued", "sending", "sent", "delivered"] },
  }).lean();

  return Boolean(existing);
};

/**
 * Central WhatsApp Dispatcher
 */
const dispatchWhatsAppMessage = async ({
  hostelId = null,
  ownerId = null,
  residentId = null,
  recipientPhone,
  recipientName = "",
  recipientType = "Resident",
  templateCode = "GENERAL_ANNOUNCEMENT",
  variables = {},
  customMessage = null,
  businessEvent = "GENERAL",
  referenceId = null,
  createdBy = null,
}) => {
  const dispatchStartedAt = process.hrtime.bigint();
  const finishDispatchTiming = () => {
    logger.info({
      operation: "dispatchWhatsAppMessage",
      timings: { totalMs: Number(process.hrtime.bigint() - dispatchStartedAt) / 1e6 },
    }, "WhatsApp dispatch performance");
  };
  try {
    const normalizedPhone = normalizePhoneNumber(recipientPhone);
    if (!normalizedPhone) {
      throw new Error("Recipient phone number is invalid for WhatsApp delivery");
    }

  const tplCategory = (TEMPLATES[templateCode] || TEMPLATES.GENERAL_ANNOUNCEMENT).category;
  const messageText = compileTemplate(templateCode, variables, customMessage);

  // Redacted variables & message text for safe MongoDB storage (Security Boundary)
  const sanitizedVariables = { ...variables };
  const runtimeTemporaryPassword = variables.temporaryPassword ?? variables.tempPassword;
  if (runtimeTemporaryPassword && runtimeTemporaryPassword !== CONTROLLED_ACTIVATION_CREDENTIAL) {
    sanitizedVariables.temporaryPassword = CONTROLLED_ACTIVATION_CREDENTIAL;
    sanitizedVariables.tempPassword = CONTROLLED_ACTIVATION_CREDENTIAL;
  }
  const sanitizedMessageText = compileTemplate(templateCode, sanitizedVariables, customMessage);
  const sanitizedWaMeUrl = buildWaMeUrl(normalizedPhone, sanitizedMessageText);

  // 1. Resolve Automation Mode via Precedence Engine
  const recipientUserId = ownerId || residentId;
  const { mode, isAutomatic, reason } = await resolveAutomationMode(hostelId, tplCategory, recipientUserId);

  // 2. Check Idempotency for all dispatches with a referenceId
  if (referenceId) {
    const isDuplicate = await checkIdempotency(hostelId, templateCode, referenceId);
    if (isDuplicate) {
      logger.info("Skipped duplicate WhatsApp message", { hostelId, templateCode, referenceId });
      return {
        success: true,
        skipped: true,
        isDuplicate: true,
        message: "Duplicate message skipped via idempotency check",
      };
    }
  }

  // 3. MANUAL MODE HANDLING
  if (!isAutomatic) {
    const liveWaMeUrl = buildWaMeUrl(normalizedPhone, messageText);
    const commRecord = await Communication.create({
      hostelId,
      ownerId,
      residentId,
      type: "whatsapp",
      recipient: normalizedPhone,
      recipientName,
      recipientType,
      templateCode,
      subject: (TEMPLATES[templateCode] || {}).name || "WhatsApp Message",
      message: sanitizedMessageText,
      mode: "manual_wame",
      status: "pending_manual",
      businessEvent,
      referenceId,
      waMeUrl: sanitizedWaMeUrl,
      metadata: { precedenceReason: reason, variables: sanitizedVariables },
      createdBy,
    });

    return {
      success: true,
      mode: "manual_wame",
      status: "pending_manual",
      waMeUrl: liveWaMeUrl,
      messageText,
      communicationId: commRecord._id,
      reason,
    };
  }

  // 4. AUTOMATIC MODE HANDLING (Meta API with Bounded Retry)
  const metaConfig = validateWhatsAppConfig();

  // Create initial queued record with sanitized password
  const commRecord = await Communication.create({
    hostelId,
    ownerId,
    residentId,
    type: "whatsapp",
    recipient: normalizedPhone,
    recipientName,
    recipientType,
    templateCode,
    subject: (TEMPLATES[templateCode] || {}).name || "WhatsApp Message",
    message: sanitizedMessageText,
    mode: "meta_api",
    status: metaConfig.isConfigured ? "queued" : "unconfigured",
    businessEvent,
    referenceId,
    attemptCount: 1,
    failureReason: metaConfig.isConfigured ? "" : metaConfig.reason,
    metadata: { precedenceReason: reason, variables: sanitizedVariables },
    createdBy,
  });

  if (!metaConfig.isConfigured) {
    return {
      success: false,
      mode: "meta_api",
      status: "unconfigured",
      messageText,
      communicationId: commRecord._id,
      error: metaConfig.reason,
    };
  }

  // Update status to 'sending' before calling Meta API
  commRecord.status = "sending";
  await commRecord.save();

  const maxAttempts = 2;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    commRecord.attemptCount = attempt;
    try {
      const result = await sendOwnerWhatsApp({
        phone: normalizedPhone,
        ownerName: recipientName,
        hostelName: variables.hostelName || "",
        username: variables.username || "",
        temporaryPassword: variables.temporaryPassword || variables.tempPassword || "",
        planType: variables.planType || "HostelMate Unified Plan",
        expiryDate: variables.expiryDate || "",
        loginUrl: variables.loginUrl || "",
        messageText,
      });

      if (result?.success) {
        commRecord.status = "sent";
        commRecord.sentAt = new Date();
        commRecord.providerMessageId = result.messageId || "accepted";
        commRecord.failureReason = "";
        await commRecord.save();

        return {
          success: true,
          mode: "meta_api",
          status: "sent",
          messageText,
          communicationId: commRecord._id,
          messageId: commRecord.providerMessageId,
        };
      } else {
        lastError = new Error(result?.message || "Meta API send failed");
      }
    } catch (err) {
      lastError = err;
      // Do not retry on permanent errors (400, 401, 403, invalid config)
      const isTransient = err.statusCode === 502 || err.statusCode === 503 || err.statusCode === 504 || err.originalStatus === 429 || err.code === "ECONNABORTED" || err.code === "ETIMEDOUT";
      if (!isTransient || attempt >= maxAttempts) {
        break;
      }
      // Brief backoff before retry attempt 2
      await new Promise((res) => setTimeout(res, 500));
    }
  }

  commRecord.status = "failed";
  commRecord.failureReason = lastError?.safeMessage || lastError?.message || "Meta delivery failed";
  await commRecord.save();

  return {
    success: false,
    mode: "meta_api",
    status: "failed",
    messageText,
    communicationId: commRecord._id,
    error: commRecord.failureReason,
  };
  } finally {
    finishDispatchTiming();
  }
};

module.exports = {
  normalizePhoneNumber,
  buildWaMeUrl,
  compileTemplate,
  resolveAutomationMode,
  checkIdempotency,
  dispatchWhatsAppMessage,
  TEMPLATES,
};
