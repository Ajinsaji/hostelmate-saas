const NotificationTemplate = require("../models/NotificationTemplate");
const { dispatchNotification } = require("./notificationCenterService");
const { logger } = require("../utils/logger");

const DEFAULT_TEMPLATES = [
  {
    templateCode: "RENT_OVERDUE",
    name: "Rent Overdue Payment Reminder",
    category: "Rent",
    subject: "Rent Payment Reminder",
    message: "Hello {{residentName}}, your rent of INR {{amount}} for {{billingPeriod}} was due on {{dueDate}}. Please make the payment to avoid late charges.",
    variables: ["residentName", "amount", "billingPeriod", "dueDate"],
    channel: "In-App",
  },
  {
    templateCode: "RENT_PAYMENT_RECEIVED",
    name: "Rent Payment Receipt Confirmation",
    category: "Rent",
    subject: "Payment Received Confirmation",
    message: "Dear {{residentName}}, we have received your payment of INR {{amount}} via {{paymentMethod}} (Payment #{{paymentNumber}}). Remaining balance: INR {{balance}}.",
    variables: ["residentName", "amount", "paymentMethod", "paymentNumber", "balance"],
    channel: "In-App",
  },
  {
    templateCode: "BUDGET_ALERT_80",
    name: "80% Category Budget Warning",
    category: "Expenses",
    subject: "Budget Warning: 80% Threshold Reached",
    message: "Warning: Category {{categoryName}} has reached 80% of its monthly budget. Spent: INR {{spentAmount}} of INR {{budgetAmount}} for {{period}}.",
    variables: ["categoryName", "spentAmount", "budgetAmount", "period"],
    channel: "In-App",
  },
  {
    templateCode: "BUDGET_ALERT_EXCEEDED",
    name: "Category Budget Exceeded Alert",
    category: "Expenses",
    subject: "Critical Alert: Category Budget Exceeded",
    message: "CRITICAL: Category {{categoryName}} has EXCEEDED its monthly budget limit! Total Spent: INR {{spentAmount}}, Budget Limit: INR {{budgetAmount}}.",
    variables: ["categoryName", "spentAmount", "budgetAmount"],
    channel: "In-App",
  },
  {
    templateCode: "MAINTENANCE_LOGGED",
    name: "New Maintenance Ticket Logged",
    category: "Maintenance",
    subject: "Maintenance Ticket Alert",
    message: "New maintenance ticket logged for Room {{roomNumber}} ({{issueType}}). Priority: {{priority}}.",
    variables: ["roomNumber", "issueType", "priority"],
    channel: "In-App",
  },
];

/**
 * Seed default notification templates if none exist
 */
async function seedDefaultNotificationTemplates() {
  for (const tpl of DEFAULT_TEMPLATES) {
    await NotificationTemplate.findOneAndUpdate(
      { templateCode: tpl.templateCode },
      { $setOnInsert: tpl },
      { upsert: true, new: true }
    );
  }
  logger.info("Checked/Seeded notification templates default library.");
}

/**
 * Compiles Handlebars/Mustache string placeholders e.g. {{residentName}} -> "Rahul"
 */
function compileMessage(templateStr, data = {}) {
  let compiled = templateStr || "";
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
    compiled = compiled.replace(regex, data[key] !== undefined ? data[key] : "");
  });
  return compiled;
}

/**
 * Dispatches a templated notification
 */
async function dispatchTemplatedNotification({ hostelId, templateCode, data = {}, recipientType = "Owner", recipientId = null, priority = "Medium", createdBy = null }) {
  await seedDefaultNotificationTemplates();

  const tpl = await NotificationTemplate.findOne({ templateCode, isActive: true });
  if (!tpl) {
    throw new Error(`Notification template '${templateCode}' not found or inactive`);
  }

  const renderedSubject = compileMessage(tpl.subject, data);
  const renderedMessage = compileMessage(tpl.message, data);

  const notification = await dispatchNotification({
    hostelId,
    type: tpl.category,
    title: renderedSubject || tpl.name,
    message: renderedMessage,
    priority: priority || "Medium",
    channel: tpl.channel,
    recipientType,
    recipientId,
    referenceType: "Template",
    referenceId: tpl._id,
    createdBy,
  });

  return notification;
}

async function getTemplates() {
  await seedDefaultNotificationTemplates();
  return await NotificationTemplate.find({ isActive: true }).sort({ templateCode: 1 });
}

module.exports = {
  seedDefaultNotificationTemplates,
  compileMessage,
  dispatchTemplatedNotification,
  getTemplates,
};
