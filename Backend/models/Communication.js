const mongoose = require("mongoose");

const communicationSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      default: null,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      default: null,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      default: null,
    },
    type: {
      type: String,
      enum: ["email", "sms", "whatsapp", "in_app"],
      required: true,
    },
    recipient: {
      type: String,
      required: true,
    },
    recipientName: {
      type: String,
      default: "",
    },
    recipientType: {
      type: String,
      enum: ["Resident", "Owner", "Staff", "Admin"],
      default: "Resident",
    },
    templateCode: {
      type: String,
      default: "CUSTOM",
    },
    subject: {
      type: String,
    },
    message: {
      type: String,
      required: true,
    },
    mode: {
      type: String,
      enum: ["manual_wame", "meta_api"],
      default: "manual_wame",
    },
    status: {
      type: String,
      enum: ["pending", "pending_manual", "manual_opened", "queued", "sending", "sent", "delivered", "failed", "unconfigured", "read", "cancelled"],
      default: "pending_manual",
    },
    businessEvent: {
      type: String,
      default: "GENERAL",
    },
    referenceId: {
      type: String,
      default: null,
    },
    waMeUrl: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    failureReason: {
      type: String,
      default: "",
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
    },
    openedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Communication", communicationSchema);
