const RecurringExpense = require("../models/RecurringExpense");
const Expense = require("../models/Expense");
const { createExpense } = require("./expenseService");
const { logger } = require("../utils/logger");

async function createRecurringRule({ hostelId, expenseId, frequency, nextRun }, userContext = {}) {
  const recurring = await RecurringExpense.create({
    tenantId: hostelId,
    hostelId,
    expenseId,
    frequency: frequency || "Monthly",
    nextRun: nextRun ? new Date(nextRun) : new Date(),
  });
  return recurring;
}

async function getRecurringExpensesList(hostelId) {
  return await RecurringExpense.find({ hostelId, isActive: true })
    .populate({
      path: "expenseId",
      populate: [{ path: "categoryId" }, { path: "vendorId" }],
    })
    .sort({ nextRun: 1 });
}

module.exports = {
  createRecurringRule,
  getRecurringExpensesList,
};
