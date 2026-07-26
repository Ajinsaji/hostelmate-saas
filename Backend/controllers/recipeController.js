const recipeService = require("../services/recipeService");
const { createRecipeSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createRecipe = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createRecipeSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const recipe = await recipeService.createRecipe(value, userCtx);
    return res.status(201).json({ success: true, message: "Recipe Created", recipe });
  } catch (err) {
    logger.error("createRecipe error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create recipe" });
  }
};

const getRecipes = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const recipes = await recipeService.getRecipes(userCtx.hostelId);
    return res.status(200).json({ success: true, recipes });
  } catch (err) {
    logger.error("getRecipes error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createRecipe,
  getRecipes,
};
