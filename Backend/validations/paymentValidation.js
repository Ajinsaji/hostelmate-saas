const Joi = require("joi");

const createOrderSchema = Joi.object({
  planId: Joi.string().required(),
});

const verifyPaymentSchema = Joi.object({
  orderId: Joi.string().required(),
  paymentId: Joi.string().required(),
  signature: Joi.string().required(),
  invoiceId: Joi.string().optional().allow("", null),
});

const retryPaymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
});

module.exports = {
  createOrderSchema,
  verifyPaymentSchema,
  retryPaymentSchema,
};
