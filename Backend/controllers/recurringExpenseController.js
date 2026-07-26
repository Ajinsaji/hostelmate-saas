const recurringExpenseService = require("../services/recurringExpenseService");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createRecurringRule = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const recurring = await recurringExpenseService.createRecurringRule(
      {
        hostelId: userCtx.hostelId,
        ...req.body,
      },
      userCtx
    );
    return res.status(201).json({ success: true, message: "Recurring Rule Configured", recurring });
  } catch (err) {
    logger.error("createRecurringRule error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to configure recurring rule" });
  }
};

const getRecurringExpenses = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const recurring = await recurringExpenseService.getRecurringExpensesList(userCtx.hostelId);
    return res.status(200).json({ success: true, recurring });
  } catch (err) {
    logger.error("getRecurringExpenses error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createRecurringRule,
  getRecurringExpenses,
};
