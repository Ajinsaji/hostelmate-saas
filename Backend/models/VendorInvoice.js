const mongoose = require("mongoose");

const vendorInvoiceSchema = new mongoose.Schema(
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
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    goodsReceiptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoodsReceipt",
      default: null,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
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
    status: {
      type: String,
      enum: ["Pending", "Matched", "Mismatch", "Approved", "Paid"],
      default: "Pending",
    },
    matchResult: {
      isQtyMatched: { type: Boolean, default: false },
      isPriceMatched: { type: Boolean, default: false },
      isVendorMatched: { type: Boolean, default: false },
      discrepancyReason: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

vendorInvoiceSchema.index({ hostelId: 1, invoiceNumber: 1 }, { unique: true });

module.exports = mongoose.model("VendorInvoice", vendorInvoiceSchema);
