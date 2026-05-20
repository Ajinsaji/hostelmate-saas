// Provider-ready helper (placeholder)
// NOTE: This file intentionally does NOT integrate any real WhatsApp provider yet.
// Future providers: WhatsApp Cloud API, Twilio, Interakt, Gupshup.

const sendOwnerWhatsApp = async (payload) => {
  // payload expected shape:
  // {
  //   ownerName,
  //   hostelName,
  //   phone,
  //   username,
  //   tempPassword,
  //   planType,
  //   expiryDate,
  //   qrUrl,
  //   loginUrl
  // }

  // Provider-ready placeholder
  // eslint-disable-next-line no-console
  console.log("WhatsApp payload:", payload);

  // For now, behave like a successful send.
  return { success: true };
};

module.exports = { sendOwnerWhatsApp };

