const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
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
      index: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: false,
    },

    attemptNumber: {
      type: Number,
      default: 1,
    },

    amount: {
      type: Number,
      required: true,
    },

    periodStart: {
      type: Date,
    },

    periodEnd: {
      type: Date,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "NetBanking", "Razorpay", "Manual", "Cash", "upi", "cash", "bank", "manual"],
      default: "Manual",
    },

    paymentGateway: {
      type: String,
      default: "System",
    },

    transactionId: {
      type: String,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Success", "Pending", "Failed", "Paid", "paid", "pending", "failed"],
      default: "Success",
    },

    billingCalculationId: {
      type: String,
    },

    recordedBy: {
      type: String,
      default: "Admin",
    },

    notes: {
      type: String,
      default: "",
    },

    errorMessage: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

subscriptionPaymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
