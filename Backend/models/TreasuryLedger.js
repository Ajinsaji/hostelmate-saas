const mongoose = require("mongoose");

const treasuryLedgerSchema = new mongoose.Schema(
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
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    accountType: {
      type: String,
      enum: ["Bank", "Cash"],
      required: true,
    },
    accountId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null, // BankAccount ObjectId when accountType is Bank
    },
    transactionType: {
      type: String,
      enum: ["Receipt", "Payment", "Transfer", "Adjustment", "Opening Balance"],
      required: true,
    },
    referenceType: {
      type: String,
      default: "Manual",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    debit: {
      type: Number,
      default: 0, // Inflow / Deposit
    },
    credit: {
      type: Number,
      default: 0, // Outflow / Withdrawal
    },
    runningBalance: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

treasuryLedgerSchema.index({ hostelId: 1, accountType: 1, accountId: 1, transactionDate: -1 });

module.exports = mongoose.model("TreasuryLedger", treasuryLedgerSchema);
