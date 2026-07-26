const budgetService = require("../services/budgetService");
const { createBudgetSchema } = require("../validations/expenseValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const setCategoryBudget = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createBudgetSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const budget = await budgetService.setCategoryBudget(
      {
        hostelId: userCtx.hostelId,
        ...value,
      },
      userCtx
    );
    return res.status(200).json({ success: true, message: "Budget Set", budget });
  } catch (err) {
    logger.error("setCategoryBudget error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to set budget" });
  }
};

const getBudgets = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const budgets = await budgetService.getBudgetsList(userCtx.hostelId, req.query.month, req.query.year);
    return res.status(200).json({ success: true, budgets });
  } catch (err) {
    logger.error("getBudgets error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  setCategoryBudget,
  getBudgets,
};
