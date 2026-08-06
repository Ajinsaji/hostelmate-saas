const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      default: "Razorpay",
      required: true,
    },
    eventId: {
      type: String,
      required: true,
      unique: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    signature: {
      type: String,
      default: "",
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processed: {
      type: Boolean,
      default: false,
    },
    processedAt: {
      type: Date,
    },
    error: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

webhookEventSchema.index({ processed: 1 });

module.exports = mongoose.model("WebhookEvent", webhookEventSchema);
