/**
 * Centralized Subscription Lifecycle Engine
 * Input: hostel (optionally merged with subscription fields)
 * Output: full lifecycle object
 */

function normalizeDate(input) {
  if (!input) return null;
  const d = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

function calcDaysLeft(expiryDate) {
  if (!expiryDate) return null;
  // Whole-day precision. If expiry is today, daysLeft should be 0.
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
 * @param {object} hostel
 * @returns {{
 *  status: string,
 *  expired: boolean,
 *  expiringSoon: boolean,
 *  trial: boolean,
 *  freeAccess: boolean,
 *  daysLeft: number|null,
 *  expiryDate: Date|null,
 *  warningLevel: 'none'|'medium'|'critical',
 *  showBanner: boolean,
 *  renewalRequired: boolean
 * }}
 */
function getSubscriptionStatus(hostel = {}) {
  // IMPORTANT lifecycle priority order:
  // isFreeAccess -> isTrial -> expired -> expiringSoon -> active

  const isFreeAccess = hostel?.isFreeAccess === true;
  const trialModifier = hostel?.isTrial === true;

  // Resolve expiry date with required priority:
  // hostel.subscriptionEndDate
  // hostel.expiryDate
  // hostel.subscriptionEnd
  const expiryDate =
    normalizeDate(hostel?.subscriptionEndDate) ||
    normalizeDate(hostel?.expiryDate) ||
    normalizeDate(hostel?.subscriptionEnd);

  const daysLeft = expiryDate ? calcDaysLeft(expiryDate) : null;

  const result = {
    status: "inactive",
    expired: false,
    expiringSoon: false,
    trial: false,
    freeAccess: false,
    daysLeft,
    expiryDate,
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

  // TRIAL
  if (trialModifier) {
    result.status = "trial";
    result.trial = true;
    result.expired = false;
    result.renewalRequired = false;
    // Keep banner/warning off during trial unless you want otherwise.
    return result;
  }

  // If we can't determine expiry, fall back to subscriptionStatus if available.
  const subscriptionStatus = hostel?.subscriptionStatus;

  if (typeof daysLeft !== "number") {
    if (subscriptionStatus === "active") {
      result.status = "active";
      return result;
    }
    // Keep default inactive
    result.status = "inactive";
    return result;
  }

  // EXPIRED
  if (daysLeft < 0) {
    result.status = "expired";
    result.expired = true;
    result.renewalRequired = true;
    result.showBanner = true;
    result.warningLevel = "critical";
    return result;
  }

  // CRITICAL WARNING: daysLeft <= 2 && daysLeft >= 0
  if (daysLeft <= 2 && daysLeft >= 0) {
    result.status = "expiringSoon";
    result.expiringSoon = true;
    result.warningLevel = "critical";
    result.showBanner = true;
    return result;
  }

  // EXPIRING SOON: daysLeft <= 7 && daysLeft > 2
  if (daysLeft <= 7 && daysLeft > 2) {
    result.status = "expiringSoon";
    result.expiringSoon = true;
    result.warningLevel = "medium";
    result.showBanner = true;
    return result;
  }

  // ACTIVE: daysLeft > 7
  if (daysLeft > 7) {
    result.status = "active";
    result.warningLevel = "none";
    result.showBanner = false;
    return result;
  }

  // Safety fallback
  if (subscriptionStatus === "active") {
    result.status = "active";
    return result;
  }

  return result;
}

module.exports = getSubscriptionStatus;

