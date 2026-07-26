const categorySerivce = require("../services/expenseCategoryService");
const { createCategorySchema } = require("../validations/expenseValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createCategory = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createCategorySchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const category = await categorySerivce.createCategory(value, userCtx);
    return res.status(201).json({ success: true, message: "Category Created", category });
  } catch (err) {
    logger.error("createCategory error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create category" });
  }
};

const getCategories = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const categories = await categorySerivce.getCategories(userCtx.hostelId);
    return res.status(200).json({ success: true, categories });
  } catch (err) {
    logger.error("getCategories error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createCategory,
  getCategories,
};
