const mongoose = require("mongoose");

const subscriptionRequestSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
      index: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    requestedDays: {
      type: Number,
      default: 30,
      min: 1,
    },
    residentCount: {
      type: Number,
      default: 0,
    },
    calculatedAmount: {
      type: Number,
      default: 0,
    },
    ownerNote: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    adminNote: {
      type: String,
      default: "",
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
    extensionDays: {
      type: Number,
      default: 30,
    },
    approvedAmount: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partial", "Pending", "Paid", "Partial"],
      default: "pending",
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

subscriptionRequestSchema.index({ hostelId: 1, status: 1 });
subscriptionRequestSchema.index({ ownerId: 1, status: 1 });

module.exports = mongoose.model("SubscriptionRequest", subscriptionRequestSchema);
