const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem");
const { logger } = require("../utils/logger");

async function createRecipe(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Calculate cost per serving based on ingredient average costs
  let calculatedCost = 0;
  if (Array.isArray(data.ingredients)) {
    for (const ing of data.ingredients) {
      const item = await InventoryItem.findById(ing.ingredientId);
      if (item) {
        calculatedCost += (ing.quantityPerServing || 0) * (item.averageCost || 0);
      }
    }
  }

  const recipe = await Recipe.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    costPerServing: calculatedCost > 0 ? calculatedCost : data.costPerServing || 25,
  });

  return recipe;
}

async function getRecipes(hostelId) {
  return await Recipe.find({ hostelId, status: "Active" })
    .populate("ingredients.ingredientId", "itemName unit averageCost")
    .sort({ dishName: 1 });
}

module.exports = {
  createRecipe,
  getRecipes,
};
