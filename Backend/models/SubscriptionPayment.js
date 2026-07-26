const mongoose = require("mongoose");

const subscriptionPaymentSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
    },

    attemptNumber: {
      type: Number,
      default: 1,
    },

    amount: {
      type: Number,
      required: true,
    },

    paymentMethod: {
      type: String,
      enum: ["UPI", "Card", "NetBanking", "Razorpay", "Manual", "Cash"],
      default: "Razorpay",
    },

    paymentGateway: {
      type: String,
      default: "Razorpay",
    },

    transactionId: {
      type: String,
      required: true,
    },

    paymentStatus: {
      type: String,
      enum: ["Success", "Pending", "Failed"],
      default: "Success",
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

subscriptionPaymentSchema.index({ hostelId: 1 });
subscriptionPaymentSchema.index({ invoiceId: 1, createdAt: -1 });
subscriptionPaymentSchema.index({ transactionId: 1 });

module.exports = mongoose.model("SubscriptionPayment", subscriptionPaymentSchema);
