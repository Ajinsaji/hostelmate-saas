const mongoose = require("mongoose");

const notificationTemplateSchema = new mongoose.Schema(
  {
    templateCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Billing", "Rent", "Expenses", "Maintenance", "Announcement", "System"],
      default: "System",
    },
    subject: {
      type: String,
      default: "",
    },
    message: {
      type: String,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    channel: {
      type: String,
      enum: ["In-App", "Email", "WhatsApp", "SMS"],
      default: "In-App",
    },
    language: {
      type: String,
      default: "en",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("NotificationTemplate", notificationTemplateSchema);
