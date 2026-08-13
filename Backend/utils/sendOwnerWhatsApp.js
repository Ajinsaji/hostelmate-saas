const { logger } = require("./logger");
const axios = require("axios");

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

// Safe WhatsApp Configuration Validator
const validateWhatsAppConfig = () => {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  const hasToken =
    Boolean(token) &&
    typeof token === "string" &&
    token.trim().length > 0 &&
    !/your_|dummy|eaag_dummy|placeholder|<token>|00000000/i.test(token);

  const hasPhoneNumberId =
    Boolean(phoneNumberId) &&
    typeof phoneNumberId === "string" &&
    phoneNumberId.trim().length > 0 &&
    !/your_|dummy|placeholder|<phone_number_id>|00000000/i.test(phoneNumberId);

  const isConfigured = hasToken && hasPhoneNumberId;

  return {
    isConfigured,
    hasToken,
    hasPhoneNumberId,
    reason: !hasToken
      ? "WHATSAPP_TOKEN is missing or placeholder"
      : !hasPhoneNumberId
      ? "WHATSAPP_PHONE_NUMBER_ID is missing or placeholder"
      : null,
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
  const config = validateWhatsAppConfig();
  if (!config.isConfigured) {
    return {
      success: false,
      verified: false,
      configured: false,
      phoneNumberIdConfigured: config.hasPhoneNumberId,
      tokenConfigured: config.hasToken,
      status: "Not Configured",
      message: "WhatsApp credential delivery service is not configured.",
    };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v19.0";
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}?fields=id,verified_name`;

  try {
    const resp = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 5000,
    });

    if (resp?.data?.id) {
      return {
        success: true,
        verified: true,
        configured: true,
        phoneNumberIdConfigured: true,
        tokenConfigured: true,
        status: "Connected",
        message: "WhatsApp configuration verified",
      };
    }

    return {
      success: false,
      verified: false,
      configured: true,
      phoneNumberIdConfigured: true,
      tokenConfigured: true,
      status: "Verification Failed",
      message: "Meta API returned unexpected response format",
    };
  } catch (err) {
    const classified = classifyMetaError(err);
    return {
      success: false,
      verified: false,
      configured: true,
      phoneNumberIdConfigured: config.hasPhoneNumberId,
      tokenConfigured: config.hasToken,
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
  tempPassword,
  planType,
  expiryDate,
  loginUrl,
}) => {
  return [
    "✨ Welcome to HostelMate",
    "",
    `Hello ${ownerName || "Hostel Owner"},`,
    "",
    `Your hostel "${hostelName || "-"}" has been successfully activated.`,
    "",
    "🔐 Login Details",
    `Username: ${username || "-"}`,
    `Temporary Password: ${tempPassword || "-"}`,
    "",
    `📦 Subscription Plan: ${planType || "-"}`,
    `📅 Expiry Date: ${expiryDate || "-"}`,
    "",
    "🌐 Login:",
    `${loginUrl || ""}`,
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
    tempPassword,
    planType,
    expiryDate,
    loginUrl,
  } = payload || {};

  const config = validateWhatsAppConfig();

  if (!config.isConfigured) {
    logger.info("Meta WhatsApp not configured. Skipping real send.", {
      hasToken: config.hasToken,
      hasPhoneNumberId: config.hasPhoneNumberId,
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
    throw new WhatsAppDeliveryError("Invalid owner phone number format for WhatsApp delivery", {
      statusCode: 502,
      errorType: "INVALID_PHONE",
    });
  }

  // Safe logging with NO sensitive credentials/passwords/tokens logged
  logger.info("STARTING WHATSAPP ONBOARDING", {
    normalizedPhone,
    hasOwnerName: Boolean(ownerName),
    hasHostelName: Boolean(hostelName),
    apiVersion: process.env.WHATSAPP_API_VERSION || "v19.0",
    hasToken: config.hasToken,
    hasPhoneNumberId: config.hasPhoneNumberId,
  });

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v19.0";
  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const to = normalizedPhone;
  const message = formatMessage({
    ownerName,
    hostelName,
    username,
    tempPassword,
    planType,
    expiryDate,
    loginUrl,
  });

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      body: message,
    },
  };

  logger.info("[Meta WhatsApp] Sending onboarding message", {
    normalizedPhone,
    to,
    url,
  });

  try {
    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
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
      messageId: resp?.data?.messages?.[0]?.id,
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
  WhatsAppDeliveryError,
};


