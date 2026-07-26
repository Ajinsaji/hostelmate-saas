const Joi = require("joi");

const createRentPlanSchema = Joi.object({
  planName: Joi.string().trim().required(),
  billingCycle: Joi.string().valid("Monthly", "Weekly", "Daily", "Custom").default("Monthly"),
  amount: Joi.number().min(0).required(),
  dueDay: Joi.number().min(1).max(31).default(5),
  graceDays: Joi.number().min(0).default(3),
  lateFeeType: Joi.string().valid("Fixed", "Percentage").default("Fixed"),
  lateFeeValue: Joi.number().min(0).default(100),
  autoGenerateInvoices: Joi.boolean().default(true),
  status: Joi.string().valid("Active", "Inactive").default("Active"),
});

const createInvoiceSchema = Joi.object({
  residentId: Joi.string().required(),
  roomId: Joi.string().allow("", null),
  bedId: Joi.string().allow("", null),
  billingPeriod: Joi.string().allow("", null),
  issueDate: Joi.date().default(Date.now),
  dueDate: Joi.date().allow(null),
  rentAmount: Joi.number().min(0).required(),
  maintenanceCharge: Joi.number().min(0).default(0),
  electricityCharge: Joi.number().min(0).default(0),
  waterCharge: Joi.number().min(0).default(0),
  wifiCharge: Joi.number().min(0).default(0),
  foodCharge: Joi.number().min(0).default(0),
  laundryCharge: Joi.number().min(0).default(0),
  parkingCharge: Joi.number().min(0).default(0),
  otherCharges: Joi.number().min(0).default(0),
  discount: Joi.number().min(0).default(0),
  lateFee: Joi.number().min(0).default(0),
  notes: Joi.string().allow("", null),
});

const recordPaymentSchema = Joi.object({
  residentId: Joi.string().required(),
  invoiceId: Joi.string().allow("", null),
  amount: Joi.number().min(0.01).required(),
  paymentMethod: Joi.string().valid("Cash", "UPI", "Bank Transfer", "Card", "Cheque", "Online", "Manual").default("UPI"),
  transactionReference: Joi.string().allow("", null),
  remarks: Joi.string().allow("", null),
});

const depositSchema = Joi.object({
  residentId: Joi.string().required(),
  depositAmount: Joi.number().min(0.01).required(),
  remarks: Joi.string().allow("", null),
});

const refundSchema = Joi.object({
  depositId: Joi.string().required(),
  refundAmount: Joi.number().min(0.01).required(),
  deductionAmount: Joi.number().min(0).default(0),
  remarks: Joi.string().allow("", null),
});

module.exports = {
  createRentPlanSchema,
  createInvoiceSchema,
  recordPaymentSchema,
  depositSchema,
  refundSchema,
};
