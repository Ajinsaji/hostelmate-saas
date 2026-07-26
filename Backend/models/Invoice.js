const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema(
  {
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },

    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HostelSubscription",
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    billingDate: {
      type: Date,
      default: Date.now,
    },

    dueDate: {
      type: Date,
    },

    paymentDate: {
      type: Date,
    },

    // Billing Snapshot (Frozen at billing time)
    planName: {
      type: String,
      required: true,
    },

    planPrice: {
      type: Number,
      required: true,
      default: 0,
    },

    residentChargeRate: {
      type: Number,
      required: true,
      default: 10,
    },

    activeResidents: {
      type: Number,
      required: true,
      default: 0,
    },

    residentCharge: {
      type: Number,
      required: true,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      default: 0,
    },

    paymentStatus: {
      type: String,
      enum: ["Paid", "Pending", "Overdue", "Failed", "Cancelled"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

invoiceSchema.index({ hostelId: 1, invoiceNumber: 1 });
invoiceSchema.index({ billingDate: 1 });

module.exports = mongoose.model("Invoice", invoiceSchema);
