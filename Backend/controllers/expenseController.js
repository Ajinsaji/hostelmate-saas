const expenseService = require("../services/expenseService");
const { createExpenseSchema } = require("../validations/expenseValidation");
const { logger } = require("../utils/logger");
const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const EventBus = require("../services/EventBus");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createExpense = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    
    // 1. Quota check via BusinessRuleEngine
    const quotaCheck = await BusinessRuleEngine.canCreateExpense(req.context?.workspaceId);
    if (!quotaCheck.allowed) {
      return res.status(403).json({ success: false, message: quotaCheck.message });
    }

    const { error, value } = createExpenseSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const expense = await expenseService.createExpense(value, userCtx);

    // 2. Emit EXPENSE_CREATED event
    EventBus.emit("EXPENSE_CREATED", {
      workspaceId: req.context?.workspaceId,
      hostelId: userCtx.hostelId,
      ownerId: userCtx.userId,
      expenseId: expense._id,
      amount: expense.amount,
      categoryId: expense.categoryId,
    });

    return res.status(201).json({ success: true, message: "Expense Recorded Successfully", expense });
  } catch (err) {
    logger.error("createExpense error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to record expense" });
  }
};

const getExpenses = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await expenseService.getExpensesList({
      hostelId: userCtx.hostelId,
      categoryId: req.query.categoryId,
      vendorId: req.query.vendorId,
      status: req.query.status,
      search: req.query.search,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("getExpenses error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const expense = await expenseService.updateExpenseStatus(req.params.id, req.body.status, userCtx);
    return res.status(200).json({ success: true, message: `Status Changed to ${req.body.status}`, expense });
  } catch (err) {
    logger.error("updateStatus error:", err);
    return res.status(400).json({ success: false, message: err.message || "Status update failed" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    await expenseService.softDeleteExpense(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Expense Soft Deleted" });
  } catch (err) {
    logger.error("deleteExpense error:", err);
    return res.status(400).json({ success: false, message: err.message || "Delete failed" });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateStatus,
  deleteExpense,
};
