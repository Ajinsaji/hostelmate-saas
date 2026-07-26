const mongoose = require("mongoose");

const cashBookSchema = new mongoose.Schema(
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
    transactionType: {
      type: String,
      enum: ["Receipt", "Payment", "Transfer"],
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
      default: 0, // Cash Received (Increases cash balance)
    },
    credit: {
      type: Number,
      default: 0, // Cash Paid (Decreases cash balance)
    },
    balance: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

cashBookSchema.index({ hostelId: 1, transactionDate: -1 });

module.exports = mongoose.model("CashBook", cashBookSchema);
