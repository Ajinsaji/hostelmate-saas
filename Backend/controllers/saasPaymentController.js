const saasPaymentService = require("../services/saasPaymentService");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const Invoice = require("../models/Invoice");
const { createOrderSchema, verifyPaymentSchema, retryPaymentSchema } = require("../validations/paymentValidation");
const { logger } = require("../utils/logger");

/**
 * POST /api/payments/create-order
 * Creates Razorpay order ID using server-calculated amount
 */
const createOrder = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const orderData = await saasPaymentService.createOrder(owner.hostelId, value.planId);
    return res.status(200).json({
      success: true,
      ...orderData,
    });
  } catch (err) {
    logger.error("createOrder controller error:", err);
    return res.status(500).json({ success: false, message: err.message || "Order creation failed" });
  }
};

/**
 * POST /api/payments/verify
 * HMAC signature verification and payment capture
 */
const verifyPayment = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const { error, value } = verifyPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const result = await saasPaymentService.verifyPayment({
      hostelId: owner.hostelId,
      orderId: value.orderId,
      paymentId: value.paymentId,
      signature: value.signature,
      invoiceId: value.invoiceId,
    });

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully!",
      invoice: result.invoice,
      subscription: result.subscription,
    });
  } catch (err) {
    logger.error("verifyPayment controller error:", err);
    return res.status(400).json({ success: false, message: err.message || "Payment verification failed" });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay Webhook Handler
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-razorpay-signature"] || req.headers["x-signature"];
    const result = await saasPaymentService.handleWebhookEvent(req.body, signature);
    return res.status(200).json({ success: true, result });
  } catch (err) {
    logger.error("handleWebhook error:", err);
    return res.status(400).json({ success: false, message: err.message || "Webhook processing failed" });
  }
};

/**
 * GET /api/payments/history
 * Gets payment attempt timeline for owner's hostel
 */
const getPaymentHistory = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(400).json({ success: false, message: "Hostel ID is required" });
    }

    const attempts = await SubscriptionPayment.find({ hostelId: owner.hostelId })
      .populate("invoiceId")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, attempts });
  } catch (err) {
    logger.error("getPaymentHistory error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

/**
 * POST /api/payments/retry
 * Retry failed payment for an existing invoice
 */
const retryPayment = async (req, res) => {
  try {
    const owner = req.owner;
    const { error, value } = retryPaymentSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const invoice = await Invoice.findOne({ _id: value.invoiceId, hostelId: owner.hostelId });
    if (!invoice) {
      return res.status(404).json({ success: false, message: "Invoice not found" });
    }

    const gateway = require("../gateways/PaymentGatewayFactory").getGateway("Razorpay");
    const order = await gateway.createOrder({
      amount: invoice.totalAmount,
      currency: "INR",
      receipt: `retry_${invoice.invoiceNumber}`,
    });

    const attemptCount = await SubscriptionPayment.countDocuments({ invoiceId: invoice._id });
    const paymentAttempt = await SubscriptionPayment.create({
      hostelId: owner.hostelId,
      invoiceId: invoice._id,
      attemptNumber: attemptCount + 1,
      amount: invoice.totalAmount,
      paymentMethod: "Razorpay",
      paymentGateway: "Razorpay",
      transactionId: order.orderId,
      paymentStatus: "Pending",
    });

    return res.status(200).json({
      success: true,
      orderId: order.orderId,
      keyId: order.keyId,
      amount: invoice.totalAmount,
      amountPaise: order.amountPaise,
      invoiceId: invoice._id,
      paymentAttemptId: paymentAttempt._id,
    });
  } catch (err) {
    logger.error("retryPayment error:", err);
    return res.status(500).json({ success: false, message: err.message || "Retry failed" });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getPaymentHistory,
  retryPayment,
};
