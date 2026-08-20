const mongoose = require("mongoose");

const SystemSettingSchema = new mongoose.Schema({
  // Platform
  platformName: { type: String, default: "HostelMate" },
  supportEmail: { type: String, default: "support@hostelmate.com" },
  phone: { type: String, default: "+91 98765 43210" },
  timezone: { type: String, default: "Asia/Kolkata" },
  currency: { type: String, default: "INR" },
  billingRate: { type: Number, default: 0 },
  securityLevel: { type: String, default: "Standard" },

  // WhatsApp Config & Templates
  whatsappAutomationEnabled: { type: Boolean, default: false },
  whatsappBusinessNumber: { type: String, default: "" },
  whatsappCountryCode: { type: String, default: "+91" },
  whatsappTemplates: {
    ownerInvitation: { type: String, default: "Welcome {{ownerName}}! Your HostelMate account for {{hostelName}} is ready." },
    residentNotification: { type: String, default: "Hello {{residentName}}, your stay details at {{hostelName}} have been updated." },
    paymentReminder: { type: String, default: "Dear {{residentName}}, your rent payment of ₹{{amount}} is due on {{dueDate}}." }
  },

  // Email Config
  emailEnabled: { type: Boolean, default: true },
  emailProvider: { type: String, default: "SMTP" },
  emailFromName: { type: String, default: "HostelMate Support" },
  emailFromAddress: { type: String, default: "no-reply@hostelmate.com" },
  emailReplyTo: { type: String, default: "support@hostelmate.com" },
  smtpHost: { type: String, default: "" },
  smtpPort: { type: Number, default: 587 },
  smtpPassword: { type: String, default: "" },

  // Storage Config
  storageProvider: { type: String, default: "Cloudinary" },
  storageApiKey: { type: String, default: "" },
  storageLimitGB: { type: Number, default: 10 },

  // Maintenance Config
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: "HostelMate platform is undergoing scheduled maintenance. Admin console remains active." },
  maintenanceAdminAccessOnly: { type: Boolean, default: true },

  // Backup Config
  backupAutoEnabled: { type: Boolean, default: true },
  backupFrequency: { type: String, default: "daily" },
  backupRetentionDays: { type: Number, default: 30 },

  // Secrets & System keys
  jwtSecret: { type: String },
  firebaseKey: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("SystemSetting", SystemSettingSchema);
