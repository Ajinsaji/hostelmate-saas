const HostelSubscription = require("../models/HostelSubscription");
const Owner = require("../models/Owner");
const ReminderLog = require("../models/ReminderLog");
const { getBillingSettings } = require("./subscriptionService");
const { publishNotification } = require("../utils/notificationPublisher");
const { logger } = require("../utils/logger");

/**
 * Executes automated subscription reminder workflow and logs every dispatch
 */
async function processSubscriptionReminders() {
  try {
    const settings = await getBillingSettings();
    const reminderDays = settings.reminderDays || [7, 2, 1];
    const gracePeriodDays = settings.gracePeriodDays || 3;
    const now = new Date();

    // Fetch all non-cancelled subscriptions
    const subscriptions = await HostelSubscription.find({
      status: { $in: ["Trial", "Active", "Grace Period"] },
    }).populate("hostelId");

    let processedCount = 0;

    for (const sub of subscriptions) {
      if (!sub.hostelId) continue;

      const targetExpiry = sub.nextBillingDate || sub.trialEndDate || sub.currentCycleEnd;
      if (!targetExpiry) continue;

      const diffMs = new Date(targetExpiry).getTime() - now.getTime();
      const daysLeft = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

      let targetStage = "None";
      let shouldNotify = false;
      let notificationTitle = "";
      let notificationMessage = "";

      if (daysLeft === 7 && reminderDays.includes(7)) {
        targetStage = "7 Days Left";
        notificationTitle = "Subscription Expiring in 7 Days";
        notificationMessage = `Your HostelMate subscription will expire in 7 days. Renew now to prevent service interruption.`;
        shouldNotify = sub.reminderStage !== "7 Days Left";
      } else if (daysLeft === 2 && reminderDays.includes(2)) {
        targetStage = "2 Days Left";
        notificationTitle = "Subscription Expiring in 2 Days";
        notificationMessage = `Only 2 days remaining on your subscription. Please make your renewal payment today.`;
        shouldNotify = sub.reminderStage !== "2 Days Left";
      } else if (daysLeft === 1 && reminderDays.includes(1)) {
        targetStage = "1 Day Left";
        notificationTitle = "Subscription Expires Tomorrow!";
        notificationMessage = `Your subscription expires tomorrow. Avoid account lock by renewing right now.`;
        shouldNotify = sub.reminderStage !== "1 Day Left";
      } else if (daysLeft === 0) {
        targetStage = "Today's Due";
        notificationTitle = "Subscription Due Today!";
        notificationMessage = `Your subscription payment is due today. Complete your payment to keep full access.`;
        shouldNotify = sub.reminderStage !== "Today's Due";
      } else if (daysLeft < 0) {
        const pastDays = Math.abs(daysLeft);
        if (pastDays <= gracePeriodDays) {
          targetStage = "Grace Period";
          notificationTitle = "Subscription In Grace Period";
          notificationMessage = `Your subscription is in a ${gracePeriodDays}-day Grace Period. Please renew immediately before system lock.`;
          shouldNotify = sub.reminderStage !== "Grace Period";
          if (sub.status !== "Grace Period") {
            sub.status = "Grace Period";
          }
        } else {
          targetStage = "Overdue";
          notificationTitle = "Subscription Expired & Locked";
          notificationMessage = `Your subscription has expired. Application features are locked. Please pay to restore access.`;
          shouldNotify = sub.reminderStage !== "Overdue";
          if (sub.status !== "Expired") {
            sub.status = "Expired";
          }
        }
      }

      if (shouldNotify && targetStage !== "None") {
        const owner = await Owner.findOne({ hostelId: sub.hostelId._id, role: "owner" });

        if (owner?._id) {
          // 1. Send In-App Notification
          await publishNotification({
            userId: owner._id,
            hostelId: sub.hostelId._id,
            type: "subscription_reminder",
            title: notificationTitle,
            message: notificationMessage,
            meta: {
              route: "/settings/subscription",
              relatedId: sub._id,
              stage: targetStage,
            },
          });

          // 2. Log to ReminderLog collection
          await ReminderLog.create({
            hostelId: sub.hostelId._id,
            type: "Subscription",
            stage: targetStage,
            channel: "InApp",
            sentTime: now,
            status: "Sent",
            message: notificationMessage,
          });

          sub.reminderStage = targetStage;
          sub.lastReminderSentAt = now;
          await sub.save();

          processedCount++;
        }
      }
    }

    logger.info(`Reminder engine run complete: ${processedCount} subscription reminders processed`);
  } catch (error) {
    logger.error("processSubscriptionReminders error:", error);
  }
}

module.exports = {
  processSubscriptionReminders,
};
