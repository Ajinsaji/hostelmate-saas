const mongoose = require("mongoose");

const mealPlanSchema = new mongoose.Schema(
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
    planName: {
      type: String,
      required: true,
      trim: true,
    },
    planCode: {
      type: String,
      required: true,
      trim: true,
    },
    mealType: {
      type: String,
      enum: ["Vegetarian", "Non-Vegetarian", "Mixed"],
      default: "Vegetarian",
    },
    monthlyCharge: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
    },
    includesBreakfast: {
      type: Boolean,
      default: true,
    },
    includesLunch: {
      type: Boolean,
      default: true,
    },
    includesSnacks: {
      type: Boolean,
      default: true,
    },
    includesDinner: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
    },
  },
  { timestamps: true }
);

mealPlanSchema.index({ hostelId: 1, planCode: 1 });

module.exports = mongoose.model("MealPlan", mealPlanSchema);
