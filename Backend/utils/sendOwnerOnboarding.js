// Wrapper/helper to orchestrate owner onboarding messaging payload
// NOTE: Provider integration will stay inside sendOwnerWhatsApp.js

const { sendOwnerWhatsApp } = require("./sendOwnerWhatsApp");

const formatDate = (d) => {
  try {
    if (!d) return "";
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    return dt.toLocaleDateString("en-GB");
  } catch {
    return "";
  }
};

const sendOwnerOnboarding = async ({
  ownerName,
  hostelName,
  phone,
  username,
  tempPassword,
  planType,
  expiryDate,
  qrUrl,
  loginUrl,
}) => {
  const payload = {
    ownerName,
    hostelName,
    phone,
    username,
    tempPassword,
    planType,
    expiryDate: formatDate(expiryDate),
    qrUrl,
    loginUrl,
  };

  // eslint-disable-next-line no-console
  // console.log("Owner onboarding payload prepared:", payload);

  return sendOwnerWhatsApp(payload);
};

module.exports = { sendOwnerOnboarding };

