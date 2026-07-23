const mongoose = require("mongoose");

const SystemSettingSchema = new mongoose.Schema({
  platformName: { type: String, default: "HostelMate" },
  supportEmail: { type: String, default: "support@hostelmate.com" },
  phone: { type: String, default: "+1234567890" },
  timezone: { type: String, default: "UTC" },
  currency: { type: String, default: "USD" },
  jwtSecret: { type: String },
  smtpHost: { type: String },
  smtpPort: { type: Number },
  smtpPassword: { type: String },
  firebaseKey: { type: String },
  storageProvider: { type: String, default: "Cloudinary" },
  storageApiKey: { type: String },
  storageLimitGB: { type: Number, default: 10 },
  maintenanceMode: { type: Boolean, default: false },
  billingRate: { type: Number, default: 0 },
  securityLevel: { type: String, default: "Standard" },
}, { timestamps: true });

module.exports = mongoose.model("SystemSetting", SystemSettingSchema);
