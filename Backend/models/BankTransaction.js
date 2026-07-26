const mongoose = require("mongoose");

const bankTransactionSchema = new mongoose.Schema(
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
    bankAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BankAccount",
      required: true,
    },
    paymentVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentVoucher",
      default: null,
    },
    receiptVoucherId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    transactionType: {
      type: String,
      enum: ["Deposit", "Withdrawal", "Transfer"],
      default: "Deposit",
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Reconciled"],
      default: "Pending",
    },
    reconciledDate: {
      type: Date,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

bankTransactionSchema.index({ hostelId: 1, bankAccountId: 1, transactionDate: -1 });

module.exports = mongoose.model("BankTransaction", bankTransactionSchema);
