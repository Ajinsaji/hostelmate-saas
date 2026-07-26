const mongoose = require("mongoose");

const receivedItemSchema = new mongoose.Schema({
  inventoryItemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
  },
  quantityReceived: {
    type: Number,
    required: true,
    min: 0.01,
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0,
  },
});

const goodsReceiptSchema = new mongoose.Schema(
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
    purchaseOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PurchaseOrder",
      required: true,
    },
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
    },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    receivedItems: [receivedItemSchema],
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

goodsReceiptSchema.index({ hostelId: 1, receiptNumber: 1 });

module.exports = mongoose.model("GoodsReceipt", goodsReceiptSchema);
