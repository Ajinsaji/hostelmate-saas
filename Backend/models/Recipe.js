const mongoose = require("mongoose");

const recipeIngredientSchema = new mongoose.Schema({
  ingredientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InventoryItem",
    required: true,
  },
  quantityPerServing: {
    type: Number,
    required: true,
    min: 0,
  },
  unit: {
    type: String,
    default: "Kg",
  },
});

const recipeSchema = new mongoose.Schema(
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
    dishName: {
      type: String,
      required: true,
      trim: true,
    },
    mealType: {
      type: String,
      enum: ["Breakfast", "Lunch", "Snacks", "Dinner"],
      default: "Lunch",
    },
    ingredients: [recipeIngredientSchema],
    costPerServing: {
      type: Number,
      default: 0,
    },
    calories: {
      type: Number,
      default: 0,
    },
    protein: {
      type: Number,
      default: 0,
    },
    fat: {
      type: Number,
      default: 0,
    },
    carbohydrate: {
      type: Number,
      default: 0,
    },
    allergens: {
      type: [String],
      default: [],
    },
    preparationTime: {
      type: String,
      default: "30 mins",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true }
);

recipeSchema.index({ hostelId: 1, dishName: 1 });

module.exports = mongoose.model("Recipe", recipeSchema);
