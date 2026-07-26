const mongoose = require("mongoose");

const inventoryItemSchema = new mongoose.Schema(
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
    itemName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ["Grains & Pulses", "Vegetables & Fruits", "Dairy & Milk", "Spices & Oils", "Gas & Fuel", "Beverages", "Packaging", "Cleaning"],
      default: "Grains & Pulses",
    },
    unit: {
      type: String,
      enum: ["Kg", "Litre", "Gram", "Packet", "Cylinder", "Piece", "Box"],
      default: "Kg",
    },
    currentStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    minimumStock: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderLevel: {
      type: Number,
      default: 20,
      min: 0,
    },
    averageCost: {
      type: Number,
      default: 0,
      min: 0,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      default: null,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["In Stock", "Low Stock", "Out of Stock"],
      default: "In Stock",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

inventoryItemSchema.pre("save", function (next) {
  if (!this.tenantId) {
    this.tenantId = this.hostelId;
  }
  if (this.currentStock <= 0) {
    this.status = "Out of Stock";
  } else if (this.currentStock <= this.reorderLevel) {
    this.status = "Low Stock";
  } else {
    this.status = "In Stock";
  }
  next();
});

inventoryItemSchema.index({ hostelId: 1, itemName: 1 });

module.exports = mongoose.model("InventoryItem", inventoryItemSchema);
