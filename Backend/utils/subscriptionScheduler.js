const { logger } = require("./logger");
const { processSubscriptionReminders } = require("../services/reminderService");

/**
 * Executes periodic subscription lifecycle and reminder processing
 */
async function checkSubscriptionStatus() {
  try {
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
