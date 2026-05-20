const axios = require("axios");

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

const formatMessage = ({
  hostelName,
  username,
  tempPassword,
  planType,
  expiryDate,
  loginUrl,
}) => {
  return [
    "Welcome to HostelMate 🎉",
    "",
    `Hostel: ${hostelName || "-"}`,
    "",
    `Username: ${username || "-"}`,
    `Temporary Password: ${tempPassword || "-"}`,
    "",
    `Plan: ${planType || "Basic"}`,
    `Expiry: ${expiryDate || "-"}`,
    "",
    "Login URL:",
    `${loginUrl || ""}`,
    "",
    "⚠️ Please change your password immediately after login.",
  ].join("\n");
};

const sendOwnerWhatsApp = async (payload) => {
  const {
    phone,
    hostelName,
    username,
    tempPassword,
    planType,
    expiryDate,
    loginUrl,
  } = payload || {};

  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION || "v19.0";

  // Non-blocking: WhatsApp must never break activation.
  if (!token || !phoneNumberId) {
    // eslint-disable-next-line no-console
    console.warn("Meta WhatsApp not configured. Skipping real send.", {
      hasToken: !!token,
      hasPhoneNumberId: !!phoneNumberId,
    });
    return { success: true, skipped: true };
  }

  const normalizedPhone = normalizePhoneNumber(phone);
  if (!normalizedPhone) {
    throw new Error("Invalid owner phone number for WhatsApp delivery");
  }

  // Temporary debug logs for WhatsApp onboarding delivery
  // eslint-disable-next-line no-console
  console.log("STARTING WHATSAPP ONBOARDING", {
    ownerPhone: phone,
    normalizedPhone,
    ownerName: payload.ownerName,
    hostelName,
    apiVersion,
    hasToken: !!token,
    hasPhoneNumberId: !!phoneNumberId,
  });

  const to = normalizedPhone;
  const message = formatMessage({
    hostelName,
    username,
    tempPassword,
    planType,
    expiryDate,
    loginUrl,
  });

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: {
      body: message,
    },
  };

  // eslint-disable-next-line no-console
  console.log("[Meta WhatsApp] Sending onboarding", {
    normalizedPhone,
    to,
    url,
    body,
  });

  try {
    const resp = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      timeout: 15000,
    });

    // eslint-disable-next-line no-console
    console.log("[Meta WhatsApp] Provider response", resp?.data);
    // eslint-disable-next-line no-console
    console.log("WHATSAPP SENT SUCCESS");

    return {
      success: true,
      provider: "meta-cloud-api",
      response: resp?.data,
      to,
    };
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("WHATSAPP SEND FAILED", err?.response?.data || err?.message);
    // eslint-disable-next-line no-console
    console.error("[Meta WhatsApp] Send failed", {
      message: err?.message,
      response: err?.response?.data,
      status: err?.response?.status,
    });

    // Rethrow so caller can decide non-blocking behavior (they should catch).
    throw err;
  }
};

module.exports = { sendOwnerWhatsApp };

