const Joi = require("joi");

const salaryStructureSchema = Joi.object({
  staffId: Joi.string().required(),
  effectiveFrom: Joi.date().allow("", null),
  basicSalary: Joi.number().min(0).required(),
  houseRentAllowance: Joi.number().min(0).default(0),
  foodAllowance: Joi.number().min(0).default(0),
  travelAllowance: Joi.number().min(0).default(0),
  medicalAllowance: Joi.number().min(0).default(0),
  otherAllowances: Joi.number().min(0).default(0),
  providentFund: Joi.number().min(0).default(0),
  esi: Joi.number().min(0).default(0),
  professionalTax: Joi.number().min(0).default(0),
  incomeTax: Joi.number().min(0).default(0),
  otherDeductions: Joi.number().min(0).default(0),
  paymentMode: Joi.string().valid("Bank Transfer", "Cash", "Cheque", "UPI").default("Bank Transfer"),
  bankName: Joi.string().allow("", null),
  accountHolder: Joi.string().allow("", null),
  accountNumber: Joi.string().allow("", null),
  ifscCode: Joi.string().allow("", null),
});

const payrollPolicySchema = Joi.object({
  salaryCalculationType: Joi.string().valid("Monthly", "Daily", "Hourly").default("Monthly"),
  lateDeductionPolicy: Joi.string().valid("None", "Half Day", "Hourly").default("None"),
  overtimeCalculationType: Joi.string().valid("Hourly", "Multiplier").default("Hourly"),
  overtimeMultiplier: Joi.number().min(1).default(1.5),
  graceMinutes: Joi.number().min(0).default(15),
  leaveDeductionPolicy: Joi.string().valid("Proportional", "Fixed").default("Proportional"),
  roundingRule: Joi.string().valid("Nearest", "Floor", "Ceil").default("Nearest"),
  currency: Joi.string().default("INR"),
  payrollFrequency: Joi.string().valid("Monthly", "Weekly").default("Monthly"),
});

const payrollAdjustmentSchema = Joi.object({
  staffId: Joi.string().required(),
  payrollPeriodId: Joi.string().allow("", null),
  type: Joi.string().valid("Addition", "Deduction").required(),
  title: Joi.string().trim().required(),
  amount: Joi.number().min(0).required(),
  reason: Joi.string().allow("", null),
});

const generatePayrollSchema = Joi.object({
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2020).required(),
  hostelId: Joi.string().allow("", null),
});

const salaryAdvanceSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  reason: Joi.string().trim().required(),
});

module.exports = {
  salaryStructureSchema,
  payrollPolicySchema,
  payrollAdjustmentSchema,
  generatePayrollSchema,
  salaryAdvanceSchema,
};
