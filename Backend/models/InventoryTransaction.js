const mongoose = require("mongoose");

const inventoryTransactionSchema = new mongoose.Schema(
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
    inventoryItemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InventoryItem",
      required: true,
    },
    transactionType: {
      type: String,
      enum: ["Purchase", "Consumption", "Adjustment", "Waste", "Opening Stock", "Closing Stock"],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    totalCost: {
      type: Number,
      default: 0,
    },
    referenceType: {
      type: String,
      default: "",
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

inventoryTransactionSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  this.totalCost = (this.quantity || 0) * (this.unitCost || 0);
  next();
});

inventoryTransactionSchema.index({ hostelId: 1, inventoryItemId: 1, createdAt: -1 });

module.exports = mongoose.model("InventoryTransaction", inventoryTransactionSchema);
