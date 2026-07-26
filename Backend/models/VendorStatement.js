const mongoose = require("mongoose");

const vendorStatementSchema = new mongoose.Schema(
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
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    transactionDate: {
      type: Date,
      default: Date.now,
    },
    transactionType: {
      type: String,
      enum: ["Invoice", "Payment", "Credit Note", "Adjustment"],
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    debit: {
      type: Number,
      default: 0, // Reduces liability (e.g. Payments made)
    },
    credit: {
      type: Number,
      default: 0, // Increases liability (e.g. Invoices received)
    },
    runningBalance: {
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

vendorStatementSchema.index({ hostelId: 1, vendorId: 1, transactionDate: 1 });

module.exports = mongoose.model("VendorStatement", vendorStatementSchema);
