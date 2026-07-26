const mongoose = require("mongoose");

const wasteLogSchema = new mongoose.Schema(
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
    wasteDate: {
      type: Date,
      default: Date.now,
    },
    meal: {
      type: String,
      enum: ["Breakfast", "Lunch", "Snacks", "Dinner", "General Kitchen"],
      default: "Lunch",
    },
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
    reason: {
      type: String,
      enum: ["Spoilage", "Expired", "Cooking Waste", "Serving Waste", "Resident Waste"],
      default: "Spoilage",
    },
    costImpact: {
      type: Number,
      default: 0,
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

wasteLogSchema.index({ hostelId: 1, wasteDate: -1 });

module.exports = mongoose.model("WasteLog", wasteLogSchema);
