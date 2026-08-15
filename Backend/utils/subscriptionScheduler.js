const { logger } = require("./logger");
const Subscription = require("../models/Subscription");
const HostelSubscription = require("../models/HostelSubscription");
const Hostel = require("../models/Hostel");
const SubscriptionHistory = require("../models/SubscriptionHistory");
const { processSubscriptionReminders } = require("../services/reminderService");

/**
 * Executes periodic subscription lifecycle and reminder processing
 */
async function checkSubscriptionStatus() {
  try {
    const now = new Date();

    // 1. Process Subscription model expirations
    const activeSubs = await Subscription.find({
      status: { $in: ["Trial", "Active", "trial", "active", "Expiring", "expiring"] },
      isFreeAccess: { $ne: true },
    });

    for (const sub of activeSubs) {
      const isTrial = sub.isTrial === true || (sub.status && sub.status.toLowerCase() === "trial");
      const targetExpiry = isTrial
        ? (sub.trialEndDate || sub.trialEnds || sub.endDate || sub.subscriptionEndDate)
        : (sub.endDate || sub.subscriptionEndDate || sub.expiresAt);

      if (!targetExpiry) continue;

      if (now > new Date(targetExpiry)) {
        const prevStatus = sub.status;
        const newStatus = isTrial ? "expired" : "expired";
        sub.status = "Expired";
        sub.subscriptionStatus = "expired";
        await sub.save();

        if (sub.hostelId) {
          await Hostel.findByIdAndUpdate(sub.hostelId, {
            subscriptionStatus: "expired",
          });
        }

        await SubscriptionHistory.create({
          hostelId: sub.hostelId,
          ownerId: sub.ownerId,
          subscriptionId: sub._id,
          action: isTrial ? "TRIAL_EXPIRED" : "SUBSCRIPTION_EXPIRED",
          previousEndDate: targetExpiry,
          newEndDate: targetExpiry,
          changedBy: "Scheduler",
          reason: isTrial ? "Trial period ended automatically" : "Subscription period ended automatically",
        });

        logger.info(`Subscription ${sub._id} for hostel ${sub.hostelId} transitioned from ${prevStatus} to Expired`);
      }
    }

    // 2. Process HostelSubscription model expirations
    const activeHostelSubs = await HostelSubscription.find({
      status: { $in: ["Trial", "Active", "Grace Period"] },
    });

    for (const hSub of activeHostelSubs) {
      const targetExpiry = hSub.nextBillingDate || hSub.trialEndDate || hSub.currentCycleEnd;
      if (!targetExpiry) continue;

      if (now > new Date(targetExpiry)) {
        hSub.status = "Expired";
        await hSub.save();
      }
    }

    // 3. Process automated notification reminders
    await processSubscriptionReminders();
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
