const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    type: {
      type: String,
      enum: ["Rent Reminder", "Budget Alert", "Maintenance Alert", "Announcement", "System"],
      default: "System",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Medium",
    },
    channel: {
      type: String,
      enum: ["In-App", "Email", "WhatsApp", "SMS"],
      default: "In-App",
    },
    recipientType: {
      type: String,
      enum: ["Owner", "Staff", "Resident"],
      default: "Owner",
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    status: {
      type: String,
      enum: ["Pending", "Sent", "Delivered", "Failed", "Read"],
      default: "Sent",
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    readAt: {
      type: Date,
      default: null,
    },
    referenceType: {
      type: String,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ hostelId: 1, recipientId: 1, status: 1 });
notificationSchema.index({ hostelId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
