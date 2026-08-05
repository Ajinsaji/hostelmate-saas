const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // Tenancy References
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: false,
    },
    // Keep hostelId optional for backward compatibility
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: false,
    },

    // PLAN TYPE (Legacy & New)
    planType: {
      type: String,
      enum: ["Basic", "Pro", "base", "pro", "enterprise", "trial", "lifetime"],
      default: "base",
    },
    plan: {
      type: String,
      enum: ["base", "pro", "enterprise", "trial", "lifetime"],
      default: "base",
    },

    // SUBSCRIPTION STATUS (Legacy & New)
    subscriptionStatus: {
      type: String,
      default: "trial",
    },
    status: {
      type: String,
      enum: [
        "Trial",
        "Active",
        "Renewal Pending",
        "Grace Period",
        "Expired",
        "Cancelled",
        "Lifetime",
      ],
      default: "Trial",
    },

    // Dates
    startedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    renewalDate: {
      type: Date,
    },
    trialEnds: {
      type: Date,
    },

    // Plan Limits
    storageLimit: {
      type: Number, // in bytes
      default: 5368709120, // 5GB in bytes
    },
    residentLimit: {
      type: Number,
      default: 100,
    },
    staffLimit: {
      type: Number,
      default: 5,
    },
    hostelLimit: {
      type: Number,
      default: 1,
    },
    features: {
      type: [String],
      default: [],
    },

    // Legacy Dates
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
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },

    // Legacy Fields
    isFreeAccess: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", "bank", "manual"],
    },
    transactionId: {
      type: String,
    },
    paymentScreenshot: {
      type: String,
    },
    currentResidentCount: {
      type: Number,
      default: 0,
    },
    multiHostelEnabled: {
      type: Boolean,
      default: false,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    notes: {
      type: String,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
