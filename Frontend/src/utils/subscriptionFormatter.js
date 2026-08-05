/**
 * Central formatter for subscription status
 * @param {Object} subscription - { status, daysLeft, warningLevel, renewalRequired }
 * @returns {string} Formatted status string
 */
export function formatSubscriptionStatus(subscription) {
  if (!subscription) {
    return "No expiry information available";
  }

  const { status, daysLeft, warningLevel, renewalRequired } = subscription;

  const statusNormalized = (status || "").toLowerCase();
  
  if (statusNormalized === "unlimited" || statusNormalized === "lifetime") {
    return "Lifetime Access";
  }
  
  if (statusNormalized === "paused") {
    return "Subscription Paused";
  }
  
  if (statusNormalized === "cancelled") {
    return "Subscription Cancelled";
  }
  
  if (statusNormalized === "expired" || renewalRequired === true) {
    return "Expired - Renew Today";
  }
  
  const hasDays = daysLeft !== null && daysLeft !== undefined && !isNaN(Number(daysLeft));
  const days = hasDays ? Number(daysLeft) : null;

  if (statusNormalized === "trial") {
    if (days !== null) {
      if (days > 0) return `Trial: ${days} Days Remaining`;
      if (days === 0) return "Trial: Expires Today";
      return "Trial: Expired";
    }
    return "Trial Active";
  }

  if (statusNormalized === "grace" || warningLevel === "grace" || warningLevel === "critical") {
    if (days !== null) {
      if (days > 0) return `Grace Period: ${days} Days Remaining`;
      if (days === 0) return "Grace Period: Expires Today";
    }
    return "Grace Period Active";
  }

  if (days !== null) {
    if (days > 0) {
      return `${days} Days Remaining`;
    }
    if (days === 0) {
      return "Expires Today";
    }
    return "Expired - Renew Today";
  }

  return "No expiry information available";
}

export default formatSubscriptionStatus;
