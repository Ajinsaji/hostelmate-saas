const Joi = require("joi");

const createCategorySchema = Joi.object({
  categoryName: Joi.string().trim().required(),
  categoryCode: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  color: Joi.string().default("#10b981"),
  icon: Joi.string().default("tag"),
  budgetLimit: Joi.number().min(0).default(0),
});

const createVendorSchema = Joi.object({
  vendorName: Joi.string().trim().required(),
  vendorCode: Joi.string().trim().allow("", null),
  category: Joi.string().default("General"),
  phone: Joi.string().allow("", null),
  email: Joi.string().email().allow("", null),
  address: Joi.string().allow("", null),
  gstNumber: Joi.string().allow("", null),
  bankAccount: Joi.string().allow("", null),
  upiId: Joi.string().allow("", null),
  contactPerson: Joi.string().allow("", null),
  remarks: Joi.string().allow("", null),
});

const createExpenseSchema = Joi.object({
  categoryId: Joi.string().required(),
  vendorId: Joi.string().allow("", null),
  title: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  amount: Joi.number().min(0.01).required(),
  taxAmount: Joi.number().min(0).default(0),
  discountAmount: Joi.number().min(0).default(0),
  paymentMethod: Joi.string().valid("Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online", "Wallet").default("UPI"),
  referenceNumber: Joi.string().allow("", null),
  receiptNumber: Joi.string().allow("", null),
  invoiceNumber: Joi.string().allow("", null),
  expenseType: Joi.string().valid("Recurring", "One Time").default("One Time"),
  status: Joi.string().valid("Draft", "Pending Approval", "Approved", "Paid", "Cancelled").default("Paid"),
  expenseDate: Joi.date().default(Date.now),
});

const createBudgetSchema = Joi.object({
  categoryId: Joi.string().required(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2020).required(),
  budgetAmount: Joi.number().min(0).required(),
});

module.exports = {
  createCategorySchema,
  createVendorSchema,
  createExpenseSchema,
  createBudgetSchema,
};
