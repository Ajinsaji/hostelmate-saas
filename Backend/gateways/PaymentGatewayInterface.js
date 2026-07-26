/**
 * Abstract Payment Gateway Interface
 * Standardizes methods across all payment providers (Razorpay, Stripe, PhonePe, Cashfree)
 */
class PaymentGatewayInterface {
  async createOrder({ amount, currency, receipt, notes }) {
    throw new Error("createOrder() must be implemented by Gateway Provider");
  }

  verifyPaymentSignature({ orderId, paymentId, signature }) {
    throw new Error("verifyPaymentSignature() must be implemented by Gateway Provider");
  }

  verifyWebhookSignature({ body, signature, secret }) {
    throw new Error("verifyWebhookSignature() must be implemented by Gateway Provider");
  }

  async refund({ paymentId, amount, reason }) {
    throw new Error("refund() must be implemented by Gateway Provider");
  }
}

module.exports = PaymentGatewayInterface;
