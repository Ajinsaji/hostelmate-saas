const mongoose = require("mongoose");

const subscriptionHistorySchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    action: {
      type: String,
      enum: [
        "TRIAL_STARTED",
        "TRIAL_EXPIRED",
        "CONTINUATION_REQUESTED",
        "CONTINUATION_APPROVED",
        "CONTINUATION_REJECTED",
        "EXTENSION_ADDED",
        "EXTENSION_REDUCED",
        "PAYMENT_RECORDED",
        "SUBSCRIPTION_EXPIRED",
        "SUBSCRIPTION_REACTIVATED",
      ],
      required: true,
    },
    previousStartDate: Date,
    previousEndDate: Date,
    newStartDate: Date,
    newEndDate: Date,
    daysAdjustment: Number,
    previousAmount: Number,
    newAmount: Number,
    changedBy: {
      type: String,
      default: "System",
    },
    reason: {
      type: String,
      default: "",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

subscriptionHistorySchema.index({ hostelId: 1, createdAt: -1 });

module.exports = mongoose.model("SubscriptionHistory", subscriptionHistorySchema);
