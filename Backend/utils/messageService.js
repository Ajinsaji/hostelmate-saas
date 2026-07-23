const { logger } = require("./logger");
const notificationService = require("./Notification/NotificationService");
/**
 * Format phone number to include country code
 * @param {string} phone - Phone number (10 digits for India)
 * @returns {string} - Phone with country code (e.g., +91XXXXXXXXXX)
 */
const formatPhoneNumber = (phone) => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  
  // If already has country code, return as is
  if (cleanPhone.startsWith('91')) {
    return '+' + cleanPhone;
  }
  
  // If 10 digits, assume India (+91)
  if (cleanPhone.length === 10) {
    return '+91' + cleanPhone;
  }
  
  // If already has + sign, return as is
  if (phone.startsWith('+')) {
    return phone;
  }
  
  return '+91' + cleanPhone;
};

/**
 * Generate WhatsApp message with credentials
 * @param {string} hostelName
 * @param {string} ownerEmail (kept for backward compat; now passed as username)
 * @param {string} tempPassword
 * @param {string} publicUrl
 * @returns {string} - Formatted message
 */
const generateWhatsAppMessage = (hostelName, username, tempPassword, publicUrl, phone, ownerName) => {
  const appUrl = "https://hostelmate-saas.vercel.app";
  const message = `🎉 *Welcome to HostelMate OS!*

Hello *${ownerName || '-'}* 👋

Your hostel *${hostelName}* has been activated successfully.

📋 *Login Credentials*

👤 Username: ${username || '-'}
📱 Phone: ${phone || '-'}
🔐 Temporary Password: ${tempPassword || '-'}

⚠️ Please change your password after your first login.

📲 HostelMate App
${appUrl}

🔗 *Hostel Public Page*
${publicUrl}

📱 Residents can use this link or scan the hostel QR code for digital admission.

🚀 Welcome to HostelMate!

Need help?
Contact your HostelMate administrator.`;

  return message;
};



const generateStaffWhatsAppMessage = (staffName, role, username, password, loginUrl) => {
  const normalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Staff";
  return `👋 Hello ${staffName},\n\nYour HostelMate OS account has been created.\n\n*Role:* ${normalizedRole}\n*Username:* ${username}\n*Password:* ${password}\n\n*Login:* ${loginUrl}\n\nPlease keep this information secure and access your dashboard using the provided credentials.`;
};

/**
 * Generate WhatsApp URL for direct messaging
 * @param {string} phone - Phone number
 * @param {string} message - Message text
 * @returns {string} - WhatsApp URL
 */
const generateWhatsAppURL = (phone, message) => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  // WhatsApp API URL: wa.me/{phone}?text={message}
  return `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
};

/**
 * Send approval messages (WhatsApp + SMS mock)
 */
const sendApprovalMessages = async (phone, ownerName, hostelName, ownerEmail, tempPassword, publicUrl) => {
  try {
    const formattedPhone = formatPhoneNumber(phone);

    const message = generateWhatsAppMessage(
      hostelName,
      ownerEmail,
      tempPassword,
      publicUrl,
      formattedPhone,
      ownerName
    );

    const whatsappURL = generateWhatsAppURL(phone, message);

    // TODO: Integrate actual Twilio / MSG91 API for production
    // const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    // await twilioClient.messages.create({
    //   body: message,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: formattedPhone
    // });

    return { success: true, whatsappURL, message };
  } catch (error) {
    logger.error("❌ Message Service Error:", error);
    return { success: false, error: error.message };
  }
};


/**
 * Generate resend WhatsApp URL for owner dashboard
 */
const generateResendWhatsAppURL = (hostelName, username, tempPassword, publicUrl, phone, ownerName) => {
  const message = generateWhatsAppMessage(
    hostelName,
    username,
    tempPassword,
    publicUrl,
    phone,
    ownerName
  );
  return generateWhatsAppURL(phone, message);
};




module.exports = {
  sendApprovalMessages,
  generateWhatsAppURL,
  generateWhatsAppMessage,
  generateStaffWhatsAppMessage,
  generateResendWhatsAppURL,
  formatPhoneNumber,
};
