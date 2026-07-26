const Budget = require("../models/Budget");
const Expense = require("../models/Expense");
const { dispatchTemplatedNotification } = require("./notificationTemplateService");
const { logger } = require("../utils/logger");

/**
 * Calculates total spent amount for a category in a given month/year and updates budget status
 */
async function updateBudgetSpent(hostelId, categoryId, month, year) {
  let budget = await Budget.findOne({ hostelId, categoryId, month, year }).populate("categoryId", "categoryName");
  if (!budget) return null;

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const expenses = await Expense.find({
    hostelId,
    categoryId,
    expenseDate: { $gte: startDate, $lte: endDate },
    status: { $in: ["Approved", "Paid"] },
    isDeleted: false,
  });

  const totalSpent = expenses.reduce((sum, e) => sum + (e.netAmount || 0), 0);
  budget.spentAmount = totalSpent;
  await budget.save(); // pre-save hook updates remainingAmount, variance, and status alert thresholds

  // Automatic Templated Notification Dispatch if threshold exceeded
  if (budget.status !== "Under Budget") {
    const catName = budget.categoryId?.categoryName || "Category";
    const templateCode = budget.status === "Budget Exceeded" ? "BUDGET_ALERT_EXCEEDED" : "BUDGET_ALERT_80";
    const priority = budget.status === "Budget Exceeded" ? "Critical" : "High";
    try {
      await dispatchTemplatedNotification({
        hostelId,
        templateCode,
        data: {
          categoryName: catName,
          spentAmount: budget.spentAmount,
          budgetAmount: budget.budgetAmount,
          period: `${month}/${year}`,
        },
        priority,
        recipientType: "Owner",
      });
    } catch (nErr) {
      logger.error("Failed to dispatch templated budget alert notification:", nErr);
    }
  }

  return budget;
}



/**
 * Create or update monthly budget for a category
 */
async function setCategoryBudget({ hostelId, categoryId, month, year, budgetAmount }, userContext = {}) {
  let budget = await Budget.findOne({ hostelId, categoryId, month, year });

  if (budget) {
    budget.budgetAmount = parseFloat(budgetAmount);
    await budget.save();
  } else {
    budget = await Budget.create({
      tenantId: hostelId,
      hostelId,
      categoryId,
      month,
      year,
      budgetAmount: parseFloat(budgetAmount),
    });
  }

  await updateBudgetSpent(hostelId, categoryId, month, year);
  return budget;
}

async function getBudgetsList(hostelId, month, year) {
  const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
  const y = year ? parseInt(year, 10) : new Date().getFullYear();

  return await Budget.find({ hostelId, month: m, year: y })
    .populate("categoryId", "categoryName categoryCode icon color")
    .sort({ createdAt: -1 });
}

module.exports = {
  updateBudgetSpent,
  setCategoryBudget,
  getBudgetsList,
};
