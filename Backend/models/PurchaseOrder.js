const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
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
    purchaseRequisitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseRequisition",
      default: null,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    expectedDelivery: {
      type: Date,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["Draft", "Issued", "Received", "Cancelled"],
      default: "Issued",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ hostelId: 1, orderNumber: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
