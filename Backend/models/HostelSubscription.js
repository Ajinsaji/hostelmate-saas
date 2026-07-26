const mongoose = require("mongoose");

const hostelSubscriptionSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      unique: true,
    },

    currentPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubscriptionPlan",
      required: true,
    },

    status: {
      type: String,
      enum: ["Trial", "Active", "Grace Period", "Expired", "Suspended", "Cancelled"],
      default: "Trial",
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

    currentCycleStart: {
      type: Date,
    },

    currentCycleEnd: {
      type: Date,
    },

    nextBillingDate: {
      type: Date,
    },

    lastPaymentDate: {
      type: Date,
    },

    platformAmount: {
      type: Number,
      default: 0,
    },

    residentCharge: {
      type: Number,
      default: 0,
    },

    totalAmount: {
      type: Number,
      default: 0,
    },

    activeResidentCount: {
      type: Number,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Overdue", "Failed"],
      default: "Paid",
    },

    renewalCount: {
      type: Number,
      default: 0,
    },

    autoRenew: {
      type: Boolean,
      default: false,
    },

    reminderStage: {
      type: String,
      enum: ["None", "7 Days Left", "2 Days Left", "1 Day Left", "Today's Due", "Overdue"],
      default: "None",
    },

    lastReminderSentAt: {
      type: Date,
      default: null,
    },

    // Plan History Tracking
    planHistory: [
      {
        planName: String,
        planId: { type: mongoose.Schema.Types.ObjectId, ref: "SubscriptionPlan" },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: String, default: "System" },
        reason: { type: String, default: "" },
      },
    ],

    // Activity Timeline Feed
    activityTimeline: [
      {
        title: { type: String, required: true },
        description: { type: String, default: "" },
        category: { type: String, default: "Subscription" },
        timestamp: { type: Date, default: Date.now },
      },
    ],

    // Internal Admin Notes (Hidden from Hostel Owners)
    internalNotes: [
      {
        note: { type: String, required: true },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
        createdByName: { type: String, default: "Admin" },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

hostelSubscriptionSchema.index({ status: 1 });
hostelSubscriptionSchema.index({ nextBillingDate: 1 });

module.exports = mongoose.model("HostelSubscription", hostelSubscriptionSchema);
