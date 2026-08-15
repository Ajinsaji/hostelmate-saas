const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    // Tenancy References
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: false,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: false,
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: false,
      index: true,
    },

    // PLAN TYPE (Unified / Canonical)
    planType: {
      type: String,
      default: "Unified",
    },
    plan: {
      type: String,
      default: "Unified",
    },

    // SUBSCRIPTION STATUS (Canonical Lifecycle)
    subscriptionStatus: {
      type: String,
      default: "trial",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Trial",
        "Active",
        "Expiring",
        "Renewal Pending",
        "Grace Period",
        "Expired",
        "Continuation Requested",
        "Suspended",
        "Cancelled",
        "Lifetime",
        "trial",
        "active",
        "expiring",
        "expired",
        "continuation_requested",
        "suspended",
      ],
      default: "Trial",
      index: true,
    },

    // Dates
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
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

    // Trial
    isTrial: {
      type: Boolean,
      default: true,
    },
    trialDays: {
      type: Number,
      default: 30,
    },
    trialStartDate: {
      type: Date,
      default: Date.now,
    },
    trialEndDate: {
      type: Date,
    },

    // Active / Paid cycle dates
    subscriptionStartDate: {
      type: Date,
    },
    subscriptionEndDate: {
      type: Date,
    },
    extensionDays: {
      type: Number,
      default: 0,
    },

    // Pricing & Payments
    monthlyRatePerResident: {
      type: Number,
      default: 10,
    },
    amount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paid: {
      type: Boolean,
      default: false,
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Partial", "Overdue", "Failed", "paid", "pending", "partial"],
      default: "Pending",
    },
    paymentMethod: {
      type: String,
      enum: ["upi", "cash", "bank", "manual", "razorpay", "Razorpay", "Manual", "Cash", "UPI"],
    },
    transactionId: {
      type: String,
    },
    paymentScreenshot: {
      type: String,
    },

    // Limits & Features
    storageLimit: {
      type: Number,
      default: 107374182400, // 100GB
    },
    residentLimit: {
      type: Number,
      default: 999999, // Unified Plan has no arbitrary limits
    },
    staffLimit: {
      type: Number,
      default: 999999,
    },
    hostelLimit: {
      type: Number,
      default: 999999,
    },
    features: {
      type: [String],
      default: [
        "canUseStaff",
        "canUseFood",
        "canUseVisitors",
        "canUseExpenses",
        "canSendWhatsApp",
        "canUseAI",
        "payroll",
        "analytics",
        "reports",
        "marketplace",
      ],
    },

    // Legacy & Tracking Fields
    isFreeAccess: {
      type: Boolean,
      default: false,
    },
    currentResidentCount: {
      type: Number,
      default: 0,
    },
    multiHostelEnabled: {
      type: Boolean,
      default: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    notes: {
      type: String,
      default: "",
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

subscriptionSchema.pre("save", function () {
  if (!this.startDate && this.startedAt) this.startDate = this.startedAt;
  if (!this.endDate && this.expiresAt) this.endDate = this.expiresAt;
  if (!this.subscriptionStartDate && this.startDate) this.subscriptionStartDate = this.startDate;
  if (!this.subscriptionEndDate && this.endDate) this.subscriptionEndDate = this.endDate;
  if (this.trialEndDate && !this.trialEnds) this.trialEnds = this.trialEndDate;
});

subscriptionSchema.index({ hostelId: 1, status: 1 });

module.exports = mongoose.model("Subscription", subscriptionSchema);
