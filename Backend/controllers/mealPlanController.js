const mealPlanService = require("../services/mealPlanService");
const { createMealPlanSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createMealPlan = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createMealPlanSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const plan = await mealPlanService.createMealPlan(value, userCtx);
    return res.status(201).json({ success: true, message: "Meal Plan Created", plan });
  } catch (err) {
    logger.error("createMealPlan error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create meal plan" });
  }
};

const getMealPlans = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const plans = await mealPlanService.getMealPlans(userCtx.hostelId);
    return res.status(200).json({ success: true, plans });
  } catch (err) {
    logger.error("getMealPlans error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createMealPlan,
  getMealPlans,
};
