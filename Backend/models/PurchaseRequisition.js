const mongoose = require("mongoose");

const requisitionItemSchema = new mongoose.Schema({
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
  estimatedCost: {
    type: Number,
    default: 0,
  },
});

const purchaseRequisitionSchema = new mongoose.Schema(
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
    requisitionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    items: [requisitionItemSchema],
    requiredDate: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["Normal", "High", "Urgent"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: ["Draft", "Submitted", "Approved", "Rejected", "Converted"],
      default: "Submitted",
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    approvedDate: {
      type: Date,
    },
    remarks: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

purchaseRequisitionSchema.index({ hostelId: 1, requisitionNumber: 1 });

module.exports = mongoose.model("PurchaseRequisition", purchaseRequisitionSchema);
