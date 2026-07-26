const { publishNotification } = require("../utils/notificationPublisher");
const ReminderLog = require("../models/ReminderLog");
const { logger } = require("../utils/logger");

const notificationQueue = [];
let isProcessingQueue = false;

const TEMPLATES = {
  payment_success: (data) => ({
    title: "Payment Successful",
    message: `Your payment of ₹${data.amount} for ${data.planName || "Subscription"} (Invoice: ${data.invoiceNumber}) was successful!`,
  }),
  payment_failed: (data) => ({
    title: "Payment Attempt Failed",
    message: `Payment attempt of ₹${data.amount} failed. Reason: ${data.reason || "Declined"}. Please retry to avoid service lock.`,
  }),
  invoice_generated: (data) => ({
    title: "Invoice Generated",
    message: `New tax invoice ${data.invoiceNumber} for ₹${data.amount} has been issued.`,
  }),
  trial_ending: (data) => ({
    title: "Trial Period Ending Soon",
    message: `Your 30-day Pro trial ends in ${data.daysRemaining || 3} days. Select a plan to continue full access.`,
  }),
  subscription_expiring: (data) => ({
    title: "Subscription Expiring Soon",
    message: `Your subscription expires on ${data.expiryDate}. Please renew to prevent service disruption.`,
  }),
  grace_period: (data) => ({
    title: "Subscription in Grace Period",
    message: `Your subscription has entered a 3-day Grace Period. Please complete payment immediately.`,
  }),
  renewal_success: (data) => ({
    title: "Subscription Renewed!",
    message: `Your ${data.planName} subscription has been renewed until ${data.nextBillingDate}. Thank you for using HostelMate!`,
  }),
};

/**
 * Enqueues a notification payload into asynchronous background processing queue
 */
function enqueueSaaSNotification({ userId, hostelId, type, templateKey, data = {}, channels = ["InApp"] }) {
  const templateFn = TEMPLATES[templateKey];
  const content = templateFn ? templateFn(data) : { title: "HostelMate SaaS Alert", message: data.message || "" };

  notificationQueue.push({
    userId,
    hostelId,
    type,
    templateKey,
    title: content.title,
    message: content.message,
    channels,
    timestamp: new Date(),
  });

  // Trigger non-blocking worker
  setImmediate(processQueue);
}

/**
 * Background Queue Worker
 */
async function processQueue() {
  if (isProcessingQueue || notificationQueue.length === 0) return;
  isProcessingQueue = true;

  while (notificationQueue.length > 0) {
    const item = notificationQueue.shift();
    try {
      if (item.userId && item.hostelId) {
        // 1. Publish In-App Notification
        await publishNotification({
          userId: item.userId,
          hostelId: item.hostelId,
          type: item.type || "subscription_alert",
          title: item.title,
          message: item.message,
          meta: { templateKey: item.templateKey },
        });

        // 2. Audit to ReminderLog
        await ReminderLog.create({
          hostelId: item.hostelId,
          type: "Subscription",
          stage: item.templateKey,
          channel: item.channels[0] || "InApp",
          sentTime: item.timestamp,
          status: "Sent",
          message: item.message,
        });
      }
    } catch (err) {
      logger.error("Queue worker error processing item:", err);
    }
  }

  isProcessingQueue = false;
}

module.exports = {
  enqueueSaaSNotification,
};
