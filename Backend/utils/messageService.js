const sendApprovalMessages = async (phone, ownerName, hostelName, username, tempPassword, publicUrl) => {
  console.log("=========================================");
  console.log("🚀 MOCK MESSAGE SERVICE TRIGGERED");
  console.log("=========================================");
  console.log(`Sending WhatsApp & SMS to: ${phone}`);
  console.log(`Welcome to Hostelmate 🎉\nYour hostel ${hostelName} has been approved successfully.\n\nLogin Credentials:\nUsername: ${username}\nPassword: ${tempPassword}\n\nPublic Hostel Link:\n${publicUrl}\n\nResidents can scan your QR code for digital admission.`);
  console.log("=========================================");
  // Note: Integrate actual Twilio / MSG91 API calls here in production.
  return true;
};

module.exports = {
  sendApprovalMessages,
};
