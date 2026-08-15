const Subscription = require("../models/Subscription");
const HostelSubscription = require("../models/HostelSubscription");
const getSubscriptionStatus = require("../utils/getSubscriptionStatus");
const { logger } = require("../utils/logger");

/**
 * Access Control Gating Middleware for Hostel Owners
 * Enforces lock when subscription reaches 'Expired' or 'Suspended' (daysRemaining < 0)
 * Preserves data and allows access to subscription pages, continuation requests, support, profile, and logout.
 */
const checkSubscription = async (req, res, next) => {
  try {
    const ownerCtx = req.owner;
    if (!ownerCtx?.hostelId) return next();

    const hostelId = ownerCtx.hostelId;
    let sub = await Subscription.findOne({ hostelId });
    if (!sub) {
      sub = await HostelSubscription.findOne({ hostelId });
    }

    if (!sub) {
      // Fail-open if subscription record is missing
      return next();
    }

    const lifecycle = getSubscriptionStatus(sub);

    // Update status in DB if expired
    if (lifecycle.expired && sub.status !== "Expired" && sub.status !== "expired" && sub.status !== "Suspended") {
      sub.status = "Expired";
      sub.subscriptionStatus = "expired";
      await sub.save().catch(() => {});
    }

    // Allowed Exemption Routes for Expired / Suspended hostels
    const allowedPathPrefixes = [
      "/api/owner/subscription",
      "/api/owner/subscription-status",
      "/api/support",
      "/api/auth/logout",
      "/api/owner/logout",
      "/api/owner/profile",
      "/api/owner/update-password",
      "/api/owner/security",
    ];

    const isAllowedPath = allowedPathPrefixes.some((prefix) => req.originalUrl?.startsWith(prefix));

    if (lifecycle.expired || sub.status === "Expired" || sub.status === "expired" || sub.status === "Suspended") {
      if (isAllowedPath) {
        return next();
      }

      return res.status(403).json({
        success: false,
        subscriptionExpired: true,
        isExpired: true,
        status: lifecycle.status,
        daysLeft: lifecycle.daysLeft,
        message: "Your HostelMate trial/subscription has expired. Please request subscription continuation to restore access.",
      });
    }

    if (lifecycle.status === "Grace Period") {
      req.subscriptionGracePeriod = true;
    }

    // Unified plan: attach all feature codes
    req.subscriptionPermissions = [
      "canUseStaff",
      "canUseFood",
      "canUseVisitors",
      "canUseExpenses",
      "canSendWhatsApp",
      "canUseAI",
      "payroll",
      "analytics",
      "reports",
      "marketplace",
    ];

    return next();
  } catch (err) {
    logger.error("checkSubscription middleware error:", err);
    return next(); // Fail-open on transient error
  }
};

/**
 * Feature Permission Middleware:
 * On Unified Plan, all features are enabled for active/trial owners.
 */
const checkFeaturePermission = (featureCode) => {
  return async (req, res, next) => {
    return next();
  };
};

module.exports = {
  checkSubscription,
  checkFeaturePermission,
};
