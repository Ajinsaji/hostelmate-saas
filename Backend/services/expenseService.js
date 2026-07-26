const Expense = require("../models/Expense");
const AuditLog = require("../models/AuditLog");
const { updateBudgetSpent } = require("./budgetService");
const { assertPeriodOpen } = require("./financialPeriodService");
const { logger } = require("../utils/logger");

async function generateExpenseNumber(hostelId) {
  const now = new Date();
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  const count = await Expense.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(4, "0");
  return `EXP-${ym}-${seq}`;
}

async function recordAuditLog({ hostelId, userId, action, actionType, targetId, details, ipAddress }) {
  try {
    await AuditLog.create({
      hostelId,
      userId: userId || null,
      action,
      actionType,
      entity: "Expense",
      targetId,
      targetModel: "Expense",
      details,
      ipAddress: ipAddress || "",
      timestamp: new Date(),
    });
  } catch (err) {
    logger.error("Error recording expense audit log:", err);
  }
}

async function createExpense(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();
  await assertPeriodOpen(hostelId, expenseDate);

  const expenseNumber = data.expenseNumber || (await generateExpenseNumber(hostelId));



  const expense = await Expense.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    expenseNumber,
    expenseDate,
    status: data.status || "Paid",
    createdBy: userContext.userId,
  });

  // Trigger budget recalculation for category
  const m = expenseDate.getMonth() + 1;
  const y = expenseDate.getFullYear();
  await updateBudgetSpent(hostelId, expense.categoryId, m, y);

  await recordAuditLog({
    hostelId,
    userId: userContext.userId,
    action: `Created Expense ${expense.expenseNumber} (₹${expense.netAmount})`,
    actionType: "CREATE",
    targetId: expense._id,
    details: { expenseNumber: expense.expenseNumber, amount: expense.netAmount },
    ipAddress: userContext.ip,
  });

  return expense;
}

async function updateExpenseStatus(expenseId, status, userContext = {}) {
  const expense = await Expense.findOne({ _id: expenseId, isDeleted: false });
  if (!expense) throw new Error("Expense not found");

  const oldStatus = expense.status;
  expense.status = status;
  if (status === "Approved" || status === "Paid") {
    expense.approvedBy = userContext.userId;
    expense.approvedDate = new Date();
  }
  await expense.save();

  const m = expense.expenseDate.getMonth() + 1;
  const y = expense.expenseDate.getFullYear();
  await updateBudgetSpent(expense.hostelId, expense.categoryId, m, y);

  await recordAuditLog({
    hostelId: expense.hostelId,
    userId: userContext.userId,
    action: `Updated Expense ${expense.expenseNumber} status from ${oldStatus} to ${status}`,
    actionType: "STATUS_CHANGE",
    targetId: expense._id,
    ipAddress: userContext.ip,
  });

  return expense;
}

async function softDeleteExpense(expenseId, userContext = {}) {
  const expense = await Expense.findById(expenseId);
  if (!expense) throw new Error("Expense not found");

  expense.isDeleted = true;
  expense.deletedAt = new Date();
  await expense.save();

  const m = expense.expenseDate.getMonth() + 1;
  const y = expense.expenseDate.getFullYear();
  await updateBudgetSpent(expense.hostelId, expense.categoryId, m, y);

  await recordAuditLog({
    hostelId: expense.hostelId,
    userId: userContext.userId,
    action: `Soft deleted Expense ${expense.expenseNumber}`,
    actionType: "DELETE",
    targetId: expense._id,
    ipAddress: userContext.ip,
  });

  return expense;
}

async function getExpensesList({ hostelId, categoryId, vendorId, status, search, page = 1, limit = 50 }) {
  const query = { hostelId, isDeleted: false };
  if (categoryId) query.categoryId = categoryId;
  if (vendorId) query.vendorId = vendorId;
  if (status) query.status = status;

  if (search) {
    const searchRegex = new RegExp(search, "i");
    query.$or = [{ title: searchRegex }, { expenseNumber: searchRegex }, { invoiceNumber: searchRegex }, { referenceNumber: searchRegex }];
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 50;
  const skip = (pageNum - 1) * limitNum;

  const [expenses, total] = await Promise.all([
    Expense.find(query)
      .populate("categoryId", "categoryName categoryCode icon color")
      .populate("vendorId", "vendorName phone")
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(limitNum),
    Expense.countDocuments(query),
  ]);

  return { expenses, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
}

module.exports = {
  createExpense,
  updateExpenseStatus,
  softDeleteExpense,
  getExpensesList,
};
