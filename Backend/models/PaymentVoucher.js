const mongoose = require("mongoose");

const paymentVoucherSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    hostelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    voucherNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    vendorInvoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VendorInvoice",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ["Bank Transfer", "UPI", "Cheque", "Cash", "Credit Card"],
      default: "Bank Transfer",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: "INR",
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Paid", "Cancelled"],
      default: "Approved",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

paymentVoucherSchema.index({ hostelId: 1, voucherNumber: 1 });

module.exports = mongoose.model("PaymentVoucher", paymentVoucherSchema);
