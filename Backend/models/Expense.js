const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
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
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expenseDate: {
      type: Date,
      default: Date.now,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExpenseCategory",
      required: true,
    },
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    taxAmount: {
      type: Number,
      default: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online", "Wallet"],
      default: "UPI",
    },
    referenceNumber: {
      type: String,
      default: "",
    },
    receiptNumber: {
      type: String,
      default: "",
    },
    invoiceNumber: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Draft", "Pending Approval", "Approved", "Paid", "Cancelled"],
      default: "Paid",
    },
    expenseType: {
      type: String,
      enum: ["Recurring", "One Time"],
      default: "One Time",
    },
    recurringRule: {
      type: String,
      default: "",
    },
    attachments: {
      type: [String],
      default: [],
    },
    remarks: {
      type: String,
      default: "",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    approvedDate: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

expenseSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  this.netAmount = Math.max(0, (this.amount || 0) + (this.taxAmount || 0) - (this.discountAmount || 0));
  if (typeof next === "function") {
    next();
  }
});

expenseSchema.index({ hostelId: 1, expenseNumber: 1 });
expenseSchema.index({ categoryId: 1, expenseDate: -1 });
expenseSchema.index({ vendorId: 1, expenseDate: -1 });

module.exports = mongoose.model("Expense", expenseSchema);
