/**
 * Centralized Subscription Lifecycle Engine
 * Input: hostel or subscription object
 * Output: full dynamic lifecycle object calculated from real dates
 */

function normalizeDate(input) {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function calcDaysLeft(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(
    expiryDate.getFullYear(),
    expiryDate.getMonth(),
    expiryDate.getDate()
  );
  const diffMs = end.getTime() - start.getTime();
  return Math.floor(diffMs / (24 * 60 * 60 * 1000));
}

/**
 * @param {object} entity (hostel or subscription)
 * @returns {{
 *  status: string,
 *  expired: boolean,
 *  expiringSoon: boolean,
 *  trial: boolean,
 *  isTrial: boolean,
 *  freeAccess: boolean,
 *  daysLeft: number|null,
 *  expiryDate: Date|null,
 *  trialEndDate: Date|null,
 *  warningLevel: 'none'|'medium'|'critical',
 *  showBanner: boolean,
 *  renewalRequired: boolean
 * }}
 */
function getSubscriptionStatus(entity = {}) {
  const isFreeAccess = entity?.isFreeAccess === true;
  const isTrial = entity?.isTrial === true || entity?.status?.toLowerCase() === "trial" || entity?.subscriptionStatus?.toLowerCase() === "trial";

  const rawTrialEndDate = normalizeDate(entity?.trialEndDate) || normalizeDate(entity?.trialEnds);
  const rawSubEndDate =
    normalizeDate(entity?.subscriptionEndDate) ||
    normalizeDate(entity?.endDate) ||
    normalizeDate(entity?.expiresAt) ||
    normalizeDate(entity?.expiryDate) ||
    normalizeDate(entity?.nextBillingDate) ||
    normalizeDate(entity?.subscriptionEnd);

  const expiryDate = isTrial ? (rawTrialEndDate || rawSubEndDate) : (rawSubEndDate || rawTrialEndDate);
  const daysLeft = expiryDate ? calcDaysLeft(expiryDate) : null;

  const result = {
    status: "inactive",
    expired: false,
    expiringSoon: false,
    trial: isTrial,
    isTrial,
    freeAccess: false,
    daysLeft,
    expiryDate,
    trialEndDate: rawTrialEndDate,
    warningLevel: "none",
    showBanner: false,
    renewalRequired: false,
  };

  // FREE ACCESS
  if (isFreeAccess) {
    result.status = "freeAccess";
    result.freeAccess = true;
    result.expired = false;
    result.renewalRequired = false;
    return result;
  }

  // If no dates available, fallback to stored status
  if (typeof daysLeft !== "number") {
    const rawStatus = (entity?.status || entity?.subscriptionStatus || "").toLowerCase();
    if (rawStatus === "active") {
      result.status = "active";
      return result;
    }
    if (rawStatus === "trial") {
      result.status = "trial";
      result.trial = true;
      return result;
    }
    if (rawStatus === "continuation_requested" || rawStatus === "continuation requested") {
      result.status = "continuation_requested";
      return result;
    }
    result.status = "inactive";
    return result;
  }

  // EXPIRED (daysLeft < 0) - applies to both Trial and Active!
  if (daysLeft < 0) {
    result.status = "expired";
    result.expired = true;
    result.trial = isTrial;
    result.renewalRequired = true;
    result.showBanner = true;
    result.warningLevel = "critical";
    return result;
  }

  // EXPIRING SOON: 0 to 2 days left
  if (daysLeft <= 2) {
    result.status = isTrial ? "trial" : "expiringSoon";
    result.expiringSoon = true;
    result.warningLevel = "critical";
    result.showBanner = true;
    return result;
  }

  // EXPIRING SOON: 3 to 7 days left
  if (daysLeft <= 7) {
    result.status = isTrial ? "trial" : "expiringSoon";
    result.expiringSoon = true;
    result.warningLevel = "medium";
    result.showBanner = true;
    return result;
  }

  // ACTIVE / IN TRIAL: > 7 days left
  result.status = isTrial ? "trial" : "active";
  result.warningLevel = "none";
  result.showBanner = false;
  return result;
}

module.exports = getSubscriptionStatus;
