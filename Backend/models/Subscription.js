const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // HOSTEL REFERENCE
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    // PLAN TYPE
    planType: {
      type: String,
      enum: ["Basic", "Pro"],
      default: "Basic",
    },

    // SUBSCRIPTION STATUS
    subscriptionStatus: {
      type: String,
      enum: [
        "trial",
        "active",
        "expired",
        "cancelled",
      ],
      default: "trial",
    },

    // TRIAL
    isTrial: {
      type: Boolean,
      default: true,
    },

    trialStartDate: {
      type: Date,
      default: Date.now,
    },

    trialEndDate: {
      type: Date,
    },

    // SUBSCRIPTION DATES
    subscriptionStartDate: {
      type: Date,
    },

    subscriptionEndDate: {
      type: Date,
    },

    // ADMIN OVERRIDE
    isFreeAccess: {
      type: Boolean,
      default: false,
    },

    // PAYMENT INFO
    amount: {
      type: Number,
      default: 0,
    },

    paymentMethod: {
      type: String,
      enum: [
        "upi",
        "cash",
        "bank",
        "manual",
      ],
    },

    transactionId: {
      type: String,
    },

    paymentScreenshot: {
      type: String,
    },

    // LIMITS
    residentLimit: {
      type: Number,
      default: 60,
    },

    currentResidentCount: {
      type: Number,
      default: 0,
    },

    // MULTI HOSTEL SUPPORT
    multiHostelEnabled: {
      type: Boolean,
      default: false,
    },

    // CREATED BY ADMIN
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    // NOTES
    notes: {
      type: String,
    },

    // NOTIFICATION TRACKING
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
  },

  { timestamps: true }
);

module.exports = mongoose.model(
  "Subscription",
  subscriptionSchema
);
