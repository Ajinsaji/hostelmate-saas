const PaymentGatewayFactory = require("../gateways/PaymentGatewayFactory");
const WebhookEvent = require("../models/WebhookEvent");
const SubscriptionPayment = require("../models/SubscriptionPayment");
const Invoice = require("../models/Invoice");
const HostelSubscription = require("../models/HostelSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { getActiveResidentCount, calculateUpgrade } = require("./subscriptionService");
const { logger } = require("../utils/logger");

/**
 * Commercial Payment Service (Server-side Amount Calculation & State Machine)
 */

/**
 * 1. Create Order: Calculates exact server-side amount, creates Order ID via Gateway
 */
async function createOrder(hostelId, planId) {
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) throw new Error("Plan not found");

  const upgradeCalc = await calculateUpgrade(hostelId, planId);
  const totalAmount = upgradeCalc.totalDue;
  
  // Calculate Subtotal & GST (18% tax readiness)
  const subtotal = totalAmount;
  const gstRate = 18;
  const gstAmount = Math.round((subtotal * gstRate) / 100);
  const grandTotal = subtotal + gstAmount;

  const gateway = PaymentGatewayFactory.getGateway("Razorpay");
  const order = await gateway.createOrder({
    amount: grandTotal,
    currency: "INR",
    receipt: `rcpt_${hostelId.toString().slice(-6)}_${Date.now()}`,
    notes: {
      hostelId: hostelId.toString(),
      planId: planId.toString(),
      planName: plan.name,
    },
  });

  const billingDate = new Date();
  const count = await Invoice.countDocuments();
  const invoiceNumber = `INV-${billingDate.getFullYear()}${String(billingDate.getMonth() + 1).padStart(2, "0")}-${String(count + 1001).padStart(5, "0")}`;

  // 1. Create Pending Invoice with Frozen Billing Snapshot
  const invoice = await Invoice.create({
    hostelId,
    invoiceNumber,
    billingDate,
    dueDate: billingDate,
    planName: plan.name,
    planPrice: upgradeCalc.priceDifference > 0 ? upgradeCalc.priceDifference : plan.monthlyPrice,
    residentChargeRate: plan.residentChargePerResident || 10,
    activeResidents: upgradeCalc.activeResidents,
    residentCharge: upgradeCalc.residentCharge,
    totalAmount: grandTotal,
    paymentStatus: "Pending",
  });

  // 2. Create Pending SubscriptionPayment Attempt
  const attemptCount = await SubscriptionPayment.countDocuments({ invoiceId: invoice._id });
  const paymentAttempt = await SubscriptionPayment.create({
    hostelId,
    invoiceId: invoice._id,
    attemptNumber: attemptCount + 1,
    amount: grandTotal,
    paymentMethod: "Razorpay",
    paymentGateway: "Razorpay",
    transactionId: order.orderId,
    paymentStatus: "Pending",
  });

  return {
    orderId: order.orderId,
    keyId: order.keyId,
    amount: grandTotal,
    amountPaise: order.amountPaise,
    currency: order.currency,
    invoiceId: invoice._id,
    invoiceNumber,
    paymentAttemptId: paymentAttempt._id,
    billingBreakdown: {
      planPrice: upgradeCalc.priceDifference > 0 ? upgradeCalc.priceDifference : plan.monthlyPrice,
      activeResidents: upgradeCalc.activeResidents,
      residentCharge: upgradeCalc.residentCharge,
      subtotal,
      gstRate,
      gstAmount,
      grandTotal,
    },
  };
}

/**
 * 2. Verify Payment: HMAC Signature verification and state machine transition to Success
 */
async function verifyPayment({ hostelId, orderId, paymentId, signature, invoiceId }) {
  const gateway = PaymentGatewayFactory.getGateway("Razorpay");
  const isValid = gateway.verifyPaymentSignature({ orderId, paymentId, signature });

  let attempt = await SubscriptionPayment.findOne({ transactionId: orderId });

  if (!isValid) {
    if (attempt) {
      attempt.paymentStatus = "Failed";
      attempt.errorMessage = "Invalid HMAC payment signature";
      await attempt.save();
    }
    throw new Error("Invalid payment signature verification failed");
  }

  // Update payment attempt to Success
  if (attempt) {
    attempt.paymentStatus = "Success";
    attempt.transactionId = paymentId; // Store final payment ID
    attempt.paidAt = new Date();
    await attempt.save();
  }

  // Update Invoice to Paid
  const invoice = await Invoice.findById(invoiceId || attempt?.invoiceId);
  if (invoice) {
    invoice.paymentStatus = "Paid";
    invoice.paymentDate = new Date();
    await invoice.save();
  }

  // Update HostelSubscription
  const plan = await SubscriptionPlan.findOne({ name: invoice?.planName || "Pro" });
  const billingDate = new Date();
  const duration = plan?.durationDays || 30;
  const nextBillingDate = new Date(billingDate.getTime() + duration * 24 * 60 * 60 * 1000);

  let sub = await HostelSubscription.findOne({ hostelId });
  if (sub) {
    sub.currentPlan = plan?._id || sub.currentPlan;
    sub.status = "Active";
    sub.subscriptionStartDate = sub.subscriptionStartDate || billingDate;
    sub.currentCycleStart = billingDate;
    sub.currentCycleEnd = nextBillingDate;
    sub.nextBillingDate = nextBillingDate;
    sub.lastPaymentDate = billingDate;
    sub.platformAmount = invoice?.planPrice || 0;
    sub.residentCharge = invoice?.residentCharge || 0;
    sub.totalAmount = invoice?.totalAmount || 0;
    sub.paymentStatus = "Paid";
    sub.renewalCount = (sub.renewalCount || 0) + 1;
    sub.reminderStage = "None";

    sub.planHistory.push({
      planName: invoice?.planName || "Pro",
      planId: plan?._id,
      changedAt: billingDate,
      reason: `Commercial payment verified (${paymentId})`,
    });

    sub.activityTimeline.push({
      title: `Subscription Renewed (${invoice?.planName})`,
      description: `Commercial payment of ₹${invoice?.totalAmount} verified via Razorpay`,
      category: "Billing",
      timestamp: billingDate,
    });

    await sub.save();
  }

  return { success: true, invoice, subscription: sub };
}

/**
 * 3. Handle Webhook Event with Idempotency Store
 */
async function handleWebhookEvent(rawBody, signature) {
  const gateway = PaymentGatewayFactory.getGateway("Razorpay");
  const isValid = gateway.verifyWebhookSignature({ body: rawBody, signature });

  const bodyObj = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
  const eventId = bodyObj.event_id || bodyObj.id || `evt_${Date.now()}`;
  const eventType = bodyObj.event || "payment.authorized";

  // Check if webhook already processed (Idempotency check)
  let existingEvent = await WebhookEvent.findOne({ eventId });
  if (existingEvent && existingEvent.processed) {
    return { success: true, duplicate: true, message: "Webhook already processed" };
  }

  if (!existingEvent) {
    existingEvent = await WebhookEvent.create({
      gateway: "Razorpay",
      eventId,
      eventType,
      payload: bodyObj,
      signature,
      receivedAt: new Date(),
      processed: false,
    });
  }

  if (!isValid) {
    existingEvent.error = "Invalid webhook signature";
    await existingEvent.save();
    throw new Error("Invalid webhook signature");
  }

  // Process event type
  if (eventType === "payment.authorized" || eventType === "order.paid") {
    const paymentEntity = bodyObj.payload?.payment?.entity || {};
    const orderId = paymentEntity.order_id;
    const paymentId = paymentEntity.id;

    if (orderId) {
      const attempt = await SubscriptionPayment.findOne({ transactionId: orderId });
      if (attempt && attempt.paymentStatus !== "Success") {
        attempt.paymentStatus = "Success";
        attempt.paidAt = new Date();
        await attempt.save();

        if (attempt.invoiceId) {
          await Invoice.findByIdAndUpdate(attempt.invoiceId, { paymentStatus: "Paid", paymentDate: new Date() });
        }
      }
    }
  }

  existingEvent.processed = true;
  existingEvent.processedAt = new Date();
  await existingEvent.save();

  return { success: true, duplicate: false, eventId };
}

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhookEvent,
};
