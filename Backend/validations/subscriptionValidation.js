const Joi = require("joi");

const planSchema = Joi.object({
  name: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  monthlyPrice: Joi.number().min(0).required(),
  trialPrice: Joi.number().min(0).default(0),
  residentChargePerResident: Joi.number().min(0).default(10),
  durationDays: Joi.number().min(1).default(30),
  features: Joi.array().items(Joi.string()).default([]),
  addons: Joi.array().items(Joi.string()).default([]),
  isActive: Joi.boolean().default(true),
});

const featureSchema = Joi.object({
  name: Joi.string().trim().required(),
  code: Joi.string().trim().required(),
  description: Joi.string().allow("", null),
  category: Joi.string().valid("Core", "Operations", "Communication", "Advanced").default("Core"),
  isPremium: Joi.boolean().default(false),
});

const billingSettingsSchema = Joi.object({
  trialDays: Joi.number().min(1).required(),
  gracePeriodDays: Joi.number().min(0).required(),
  reminderDays: Joi.array().items(Joi.number().min(0)).required(),
  dueReminderIntervalHours: Joi.number().min(1).required(),
  residentChargeMode: Joi.string().required(),
});

const paymentSchema = Joi.object({
  planId: Joi.string().required(),
  paymentMethod: Joi.string().valid("UPI", "Card", "NetBanking", "Razorpay", "Manual", "Cash").default("Razorpay"),
  transactionId: Joi.string().allow("", null),
});

const upgradeCalcSchema = Joi.object({
  planId: Joi.string().required(),
});

module.exports = {
  planSchema,
  featureSchema,
  billingSettingsSchema,
  paymentSchema,
  upgradeCalcSchema,
};
