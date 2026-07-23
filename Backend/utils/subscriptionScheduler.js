const { logger } = require("./logger");
const Subscription = require("../models/Subscription");
const Admin = require("../models/Admin");
const Owner = require("../models/Owner");
const { publishNotification } = require("./notificationPublisher");

/**
 * Check subscriptions for reminders (expiring in 7 days) and expired notifications
 * Runs periodically (e.g., every hour or daily)
 */
async function checkSubscriptionStatus() {
  try {
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Find active subscriptions expiring within 7 days (but not already reminded recently)
    const expiringSubscriptions = await Subscription.find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lte: sevenDaysFromNow, $gte: now },
      lastReminderSentAt: { $lt: yesterday }, // Avoid duplicate reminders
    }).populate("hostelId");

    for (const sub of expiringSubscriptions || []) {
      try {
        const owner = await Owner.findOne({
          hostelId: sub.hostelId,
          role: "owner",
        });

        if (owner?._id) {
          const daysLeft = Math.ceil(
            (sub.subscriptionEndDate - now) / (24 * 60 * 60 * 1000)
          );

          await publishNotification({
            userId: owner._id,
            hostelId: sub.hostelId,
            type: "subscription_reminder",
            title: "Subscription Expiring Soon",
            message: `Your subscription expires in ${daysLeft} days`,
            meta: {
              route: "/settings/subscription",
              relatedId: sub._id,
            },
          });

          // Update last reminder sent
          sub.lastReminderSentAt = new Date();
          await sub.save();
        }
      } catch (e) {
        logger.error(
          "Subscription reminder notification failed:",
          e?.message || e
        );
      }
    }

    // Find expired subscriptions (not already marked as expired)
    const expiredSubscriptions = await Subscription.find({
      subscriptionStatus: "active",
      subscriptionEndDate: { $lt: now },
    }).populate("hostelId");

    for (const sub of expiredSubscriptions || []) {
      try {
        const owner = await Owner.findOne({
          hostelId: sub.hostelId,
          role: "owner",
        });

        if (owner?._id) {
          await publishNotification({
            userId: owner._id,
            hostelId: sub.hostelId,
            type: "subscription_expired",
            title: "Subscription Expired",
            message: "Your subscription has expired. Please renew to continue.",
            meta: {
              route: "/settings/subscription",
              relatedId: sub._id,
            },
          });
        }

        // Mark as expired
        sub.subscriptionStatus = "expired";
        await sub.save();
      } catch (e) {
        logger.error(
          "Subscription expired notification failed:",
          e?.message || e
        );
      }
    }

    logger.info(
      `Subscription check completed: ${expiringSubscriptions.length} reminders, ${expiredSubscriptions.length} expired`
    );
  } catch (error) {
    logger.error("Subscription scheduler error:", error?.message || error);
  }
}

/**
 * Start the subscription scheduler
 * Runs every 1 hour by default
 */
function startSubscriptionScheduler(intervalMs = 60 * 60 * 1000) {
  logger.info("Starting subscription scheduler...");
  
  // Run immediately on startup
  checkSubscriptionStatus();
  
  // Then run at intervals
  setInterval(checkSubscriptionStatus, intervalMs);
}

module.exports = {
  checkSubscriptionStatus,
  startSubscriptionScheduler,
};
