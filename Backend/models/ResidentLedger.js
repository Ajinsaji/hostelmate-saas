const mongoose = require("mongoose");

const residentLedgerSchema = new mongoose.Schema(
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
    residentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    transactionType: {
      type: String,
      enum: ["Rent", "Payment", "Deposit", "Refund", "Discount", "Late Fee", "Adjustment"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    debit: {
      type: Number,
      default: 0,
      min: 0,
    },
    credit: {
      type: Number,
      default: 0,
      min: 0,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

residentLedgerSchema.index({ residentId: 1, transactionDate: 1 });
residentLedgerSchema.index({ hostelId: 1, transactionDate: -1 });

module.exports = mongoose.model("ResidentLedger", residentLedgerSchema);
