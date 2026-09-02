const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: false,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: false,
    },
    type: {
      type: String,
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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
      index: true,
    },
    isProcessedForPush: {
      type: Boolean,
      default: false,
      index: true,
    },
    pushDeliveredAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

// Canonical user-scoped query index: userId is the authoritative ownership field
notificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

// Migration compat: recipientId fallback (will be removed after backfill)
notificationSchema.index({ recipientId: 1, readAt: 1, createdAt: -1 });

// FCM push delivery index (existing — kept)
notificationSchema.index({ userId: 1, isProcessedForPush: 1 });

// Legacy hostelId index kept for admin/audit views (NOT used as security boundary)
notificationSchema.index({ hostelId: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
