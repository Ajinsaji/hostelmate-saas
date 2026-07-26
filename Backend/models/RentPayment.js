const mongoose = require("mongoose");

const rentPaymentSchema = new mongoose.Schema(
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
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RentInvoice",
      default: null,
    },
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online", "Manual"],
      default: "UPI",
    },
    transactionReference: {
      type: String,
      default: "",
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    remarks: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Refunded"],
      default: "Completed",
    },
    receiptPdfPath: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

rentPaymentSchema.index({ hostelId: 1, paymentNumber: 1 });
rentPaymentSchema.index({ residentId: 1, paymentDate: -1 });

module.exports = mongoose.model("RentPayment", rentPaymentSchema);
