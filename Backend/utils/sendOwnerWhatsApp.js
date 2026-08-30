const { logger } = require("./logger");
const axios = require("axios");
const crypto = require("crypto");

// Custom Error Class for Meta WhatsApp Delivery Failures
class WhatsAppDeliveryError extends Error {
  constructor(message, { statusCode = 502, errorType = "META_DELIVERY_FAILED", originalStatus = null } = {}) {
    super(message);
    this.name = "WhatsAppDeliveryError";
    this.safeMessage = message;
    this.statusCode = statusCode;
    this.errorType = errorType;
    this.originalStatus = originalStatus;
    this.deliveryStatus = "failed";
  }
}

// Normalize phone to E.164-like with country code for India.
// Input examples: "+91 98765 43210", "9876543210", "09876543210"
// Output example: "919876543210" (no leading +)
const normalizePhoneNumber = (phone) => {
  if (!phone) return null;

  const digits = String(phone).replace(/\D/g, "");
  if (!digits) return null;

  // Remove leading zeros
  let normalized = digits.replace(/^0+/, "");

  // If already has country code 91
  if (normalized.startsWith("91")) {
    if (normalized.length !== 12) return null;
    return normalized;
  }

  // If local 10-digit number
  if (normalized.length === 10) {
    return `91${normalized}`;
  }

  // Otherwise unsupported
  return null;
};

// Clean and validate Meta WhatsApp configuration from process.env
const getCleanMetaConfig = () => {
  const rawToken = process.env.WHATSAPP_TOKEN;
  const rawPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const rawApiVersion = process.env.WHATSAPP_API_VERSION;

  const token =
    typeof rawToken === "string"
      ? rawToken
          .replace(/^Bearer\s+/i, "")
          .replace(/^["']|["']$/g, "")
          .trim()
      : "";

  const phoneNumberId =
    typeof rawPhoneId === "string"
      ? rawPhoneId
          .replace(/^["']|["']$/g, "")
          .trim()
      : "";

  let apiVersion =
    typeof rawApiVersion === "string" && rawApiVersion.trim()
      ? rawApiVersion.replace(/^["']|["']$/g, "").trim()
      : "v19.0";

  if (apiVersion && !apiVersion.startsWith("v")) {
    apiVersion = `v${apiVersion}`;
  }
  if (!apiVersion) {
    apiVersion = "v19.0";
  }

  const isDummyToken =
    /^(your_|dummy|eaag_dummy|placeholder|<token>|00000000|null|undefined|none)/i.test(token);
  const isDummyPhoneId =
    /^(your_|dummy|placeholder|<phone_number_id>|00000000|null|undefined|none)/i.test(phoneNumberId);

  const hasToken = Boolean(token) && token.length >= 20 && !isDummyToken;
  const hasPhoneNumberId = Boolean(phoneNumberId) && phoneNumberId.length >= 10 && !isDummyPhoneId;
  const hasApiVersion = Boolean(apiVersion) && /^v\d+(\.\d+)?$/.test(apiVersion);

  const isConfigured = hasToken && hasPhoneNumberId && hasApiVersion;

  return {
    token,
    phoneNumberId,
    apiVersion,
    isConfigured,
    hasToken,
    hasPhoneNumberId,
    hasApiVersion,
  };
};

// Safe WhatsApp Configuration Validator (Returns ONLY boolean flags - NEVER secrets)
const validateWhatsAppConfig = () => {
  const { isConfigured, hasToken, hasPhoneNumberId, hasApiVersion } = getCleanMetaConfig();

  return {
    isConfigured,
    hasToken,
    hasPhoneNumberId,
    hasApiVersion,
  };
};

// Classify Meta Graph API errors into safe human-readable application errors
const classifyMetaError = (err) => {
  const status = err?.response?.status;

  if (status === 401) {
    return new WhatsAppDeliveryError(
      "WhatsApp authentication failed. Please verify the Meta access token and WhatsApp Business configuration.",
      { statusCode: 502, errorType: "META_AUTHENTICATION", originalStatus: 401 }
    );
  }
  if (status === 403) {
    return new WhatsAppDeliveryError(
      "WhatsApp permission denied. Please verify the Meta Business permissions for this number.",
      { statusCode: 502, errorType: "META_PERMISSION", originalStatus: 403 }
    );
  }
  if (status === 400) {
    return new WhatsAppDeliveryError(
      "WhatsApp rejected the message request. Please verify the recipient number, template, and message payload.",
      { statusCode: 502, errorType: "META_REJECTED", originalStatus: 400 }
    );
  }
  if (status === 429) {
    return new WhatsAppDeliveryError(
      "WhatsApp rate limit reached. Please try again later.",
      { statusCode: 502, errorType: "META_RATE_LIMIT", originalStatus: 429 }
    );
  }
  if (status && status >= 500) {
    return new WhatsAppDeliveryError(
      "WhatsApp service is temporarily unavailable. Please try again.",
      { statusCode: 502, errorType: "META_UNAVAILABLE", originalStatus: status }
    );
  }

  return new WhatsAppDeliveryError(
    err?.message || "WhatsApp delivery failed due to network or service error.",
    { statusCode: 502, errorType: "META_DELIVERY_FAILED", originalStatus: status || null }
  );
};

// Perform safe Meta API verification ping without sending message
const verifyMetaWhatsAppConfig = async () => {
  const config = getCleanMetaConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      verified: false,
      configured: false,
      errorType: "UNCONFIGURED",
      deliveryStatus: "unconfigured",
      status: "Not Configured",
      message: "WhatsApp credential delivery service is not configured.",
    };
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}?fields=id,verified_name,display_phone_number`;

  try {
    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${config.token}`,
      },
      timeout: 7000,
    });

    if (resp?.data?.id) {
      return {
        success: true,
        verified: true,
        configured: true,
        deliveryStatus: "verified",
        status: "Connected",
        message: "WhatsApp configuration verified",
      };
    }

    return {
      success: false,
      verified: false,
      configured: true,
      errorType: "META_REJECTED",
      deliveryStatus: "failed",
      status: "Verification Failed",
      message: "Meta API returned unexpected response format",
    };
  } catch (err) {
    const classified = classifyMetaError(err);
    return {
      success: false,
      verified: false,
      configured: true,
      deliveryStatus: "failed",
      status:
        classified.originalStatus === 401
          ? "Authentication Failed"
          : classified.originalStatus === 403
          ? "Permission Failed"
          : "Verification Failed",
      message: classified.safeMessage,
      errorType: classified.errorType,
    };
  }
};

const formatMessage = ({
  ownerName,
  hostelName,
  username,
  phone,
  temporaryPassword,
  planType,
  trialDays,
  trialStartDate,
  trialEndDate,
  trialAmount,
  subscriptionAmount,
  billingCycle,
  expiryDate,
  loginUrl,
}) => {
  const safePlan =
    !planType || planType === "Pro" || planType === "Basic" || planType === "Enterprise"
      ? "HostelMate Unified Plan"
      : planType;

  const safeUsername = username || phone || "-";
  const safeTrialDays = trialDays !== undefined && trialDays !== null ? trialDays : 30;
  const safeTrialStart = trialStartDate || "-";
  const safeTrialEnd = trialEndDate || expiryDate || "-";
  const safeTrialAmount = trialAmount !== undefined && trialAmount !== null ? trialAmount : "0";
  const safeSubAmount = subscriptionAmount !== undefined && subscriptionAmount !== null ? subscriptionAmount : "10";
  const safeBillingCycle = billingCycle || "Month";
  const safeExpiry = expiryDate || safeTrialEnd;
  const safeLoginUrl = loginUrl || "https://hostelmate-saas.vercel.app/owner/login";

  return [
    "🎉 Welcome to HostelMate",
    "",
    `Hello ${ownerName || "Hostel Owner"},`,
    "",
    `Your hostel "${hostelName || "-"}" has been successfully activated.`,
    "",
    "🔐 Login Details",
    `Username: ${safeUsername}`,
    `Temporary Password: ${temporaryPassword || "-"}`,
    "",
    `📦 Subscription: ${safePlan}`,
    `🎁 Trial Period: ${safeTrialDays} Days Free`,
    "",
    `📅 Trial Start Date: ${safeTrialStart}`,
    `📅 Trial End Date: ${safeTrialEnd}`,
    "",
    "💰 Subscription Details",
    `Trial Amount: ₹${safeTrialAmount}`,
    `Subscription Amount: ₹${safeSubAmount} / ${safeBillingCycle}`,
    "",
    `📅 Expiry Date: ${safeExpiry}`,
    "",
    "🔗 Login:",
    `${safeLoginUrl}`,
    "",
    "⚠️ Please change your password immediately after login.",
    "",
    "Thank you for choosing HostelMate ❤️",
  ].join("\n");
};

const sendOwnerWhatsApp = async (payload) => {
  const {
    phone,
    ownerName,
    hostelName,
    username,
    temporaryPassword,
    tempPassword,
    planType,
    trialDays,
    trialStartDate,
    trialEndDate,
    trialAmount,
    subscriptionAmount,
    billingCycle,
    expiryDate,
    loginUrl,
    messageText,
    customMessage,
  } = payload || {};

  const config = getCleanMetaConfig();

  if (!config.isConfigured) {
    logger.info("Meta WhatsApp not configured. Skipping real send.", {
      hasToken: config.hasToken,
      hasPhoneNumberId: config.hasPhoneNumberId,
      hasApiVersion: config.hasApiVersion,
    });
    return {
      success: false,
      skipped: true,
      unconfigured: true,
      deliveryStatus: "unconfigured",
      message: "WhatsApp credential delivery service is not configured.",
    };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    throw new WhatsAppDeliveryError("Invalid recipient phone number format for WhatsApp delivery", {
      statusCode: 502,
      errorType: "INVALID_PHONE",
    });
  }

  // Safe logging with NO sensitive credentials/passwords/tokens logged
  logger.info("STARTING WHATSAPP ONBOARDING", {
    normalizedPhone,
    hasOwnerName: Boolean(ownerName),
    hasHostelName: Boolean(hostelName),
    apiVersion: config.apiVersion,
    hasToken: config.hasToken,
    hasPhoneNumberId: config.hasPhoneNumberId,
  });

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;
  const to = normalizedPhone;
  const runtimeTemporaryPassword = temporaryPassword || tempPassword;
  const passwordFingerprint = runtimeTemporaryPassword
    ? crypto.createHash("sha256").update(runtimeTemporaryPassword).digest("hex").slice(0, 12)
    : null;
  const message =
    messageText ||
    customMessage ||
    formatMessage({
      ownerName,
      hostelName,
      username,
      temporaryPassword: runtimeTemporaryPassword,
      planType,
      expiryDate,
      loginUrl,
    });

  const templateName = process.env.WHATSAPP_OWNER_ACTIVATION_TEMPLATE || "hostelmate_owner_activation";
  const templateLanguage = process.env.WHATSAPP_OWNER_ACTIVATION_TEMPLATE_LANGUAGE || "en_US";
  const useTemplate = payload.useTemplate !== false && Boolean(templateName);

  let body;
  if (useTemplate) {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: templateLanguage,
        },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: String(ownerName || "Hostel Owner") },
              { type: "text", text: String(hostelName || "HostelMate") },
              { type: "text", text: String(username || phone || "-") },
              { type: "text", text: String(runtimeTemporaryPassword || "-") },
              { type: "text", text: String(trialStartDate || "-") },
              { type: "text", text: String(trialEndDate || expiryDate || "-") },
              { type: "text", text: String(subscriptionAmount || "10") },
              { type: "text", text: String(loginUrl || "https://hostelmate-saas.vercel.app/owner/login") },
            ],
          },
        ],
      },
    };
  } else {
    body = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: {
        body: message,
      },
    };
  }

  logger.info("[Meta WhatsApp] Sending onboarding message", {
    normalizedPhone,
    to,
    url,
    useTemplate,
    templateName: useTemplate ? templateName : undefined,
    passwordFingerprint,
  });

  try {
    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      timeout: 5000,
    });

    logger.info("WHATSAPP SENT SUCCESS", {
      messageId: resp?.data?.messages?.[0]?.id || "accepted",
    });

    return {
      success: true,
      deliveryStatus: "sent",
      provider: "meta-cloud-api",
      messageId: resp?.data?.messages?.[0]?.id || "accepted",
      to,
    };
  } catch (err) {
    const classifiedErr = classifyMetaError(err);
    logger.error("WHATSAPP SEND FAILED", {
      errorType: classifiedErr.errorType,
      statusCode: classifiedErr.statusCode,
      originalStatus: classifiedErr.originalStatus,
      safeMessage: classifiedErr.safeMessage,
    });

    throw classifiedErr;
  }
};

module.exports = {
  sendOwnerWhatsApp,
  validateWhatsAppConfig,
  verifyMetaWhatsAppConfig,
  getCleanMetaConfig,
  classifyMetaError,
  WhatsAppDeliveryError,
};


