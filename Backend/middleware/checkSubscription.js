const HostelSubscription = require("../models/HostelSubscription");
const SubscriptionPlan = require("../models/SubscriptionPlan");
const { getBillingSettings } = require("../services/subscriptionService");
const { logger } = require("../utils/logger");

/**
 * Access Control Gating Middleware for Hostel Owners
 * Enforces dynamic lock when subscription reaches 'Expired' or 'Suspended'
 * Allows Grace Period with warning flag.
 */
const checkSubscription = async (req, res, next) => {
  try {
    const ownerCtx = req.owner;
    if (!ownerCtx?.hostelId) return next();

    const hostelId = ownerCtx.hostelId;
    let sub = await HostelSubscription.findOne({ hostelId }).populate({
      path: "currentPlan",
      populate: { path: "features" },
    });

    if (!sub) {
      // Fail-open if subscription record is missing during migration
      return next();
    }

    const settings = await getBillingSettings();
    const now = new Date();
    const targetExpiry = sub.nextBillingDate || sub.trialEndDate || sub.currentCycleEnd;

    let daysRemaining = 0;
    if (targetExpiry) {
      const diffMs = new Date(targetExpiry).getTime() - now.getTime();
      daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
    }

    // Dynamic Grace Period & Expiry Evaluation
    if (daysRemaining < 0) {
      const pastDays = Math.abs(daysRemaining);
      if (pastDays <= (settings.gracePeriodDays || 3)) {
        if (sub.status !== "Grace Period" && sub.status !== "Suspended" && sub.status !== "Cancelled") {
          sub.status = "Grace Period";
          await sub.save();
        }
      } else {
        if (sub.status !== "Expired" && sub.status !== "Suspended" && sub.status !== "Cancelled") {
          sub.status = "Expired";
          await sub.save();
        }
      }
    }

    // Exemption Routes for Expired / Suspended hostels
    const allowedPathPrefixes = [
      "/api/owner/subscription",
      "/api/support",
      "/api/auth/logout",
    ];

    const isAllowedPath = allowedPathPrefixes.some((prefix) => req.originalUrl?.startsWith(prefix));

    if (sub.status === "Expired" || sub.status === "Suspended" || sub.status === "Cancelled") {
      if (isAllowedPath) {
        return next();
      }

      return res.status(403).json({
        success: false,
        subscriptionExpired: true,
        status: sub.status,
        message: "Your subscription has expired. Please renew your subscription to restore full access.",
      });
    }

    if (sub.status === "Grace Period") {
      req.subscriptionGracePeriod = true;
    }

    // Attach permissions list for downstream handlers
    const features = sub.currentPlan?.features || [];
    req.subscriptionPermissions = features.map((f) => f.code || f);

    return next();
  } catch (err) {
    logger.error("checkSubscription middleware error:", err);
    return next(); // Fail-open to prevent breaking system during transient DB error
  }
};

/**
 * Permission-based Feature Gating Middleware
 * Usage: router.get('/ai-insights', checkFeaturePermission('canUseAI'), controller)
 */
const checkFeaturePermission = (featureCode) => {
  return async (req, res, next) => {
    try {
      const permissions = req.subscriptionPermissions || [];
      if (permissions.includes(featureCode)) {
        return next();
      }

      return res.status(403).json({
        success: false,
        featureLocked: true,
        featureCode,
        message: `Your current subscription plan does not include the feature '${featureCode}'. Please upgrade your plan.`,
      });
    } catch (err) {
      return next();
    }
  };
};

module.exports = {
  checkSubscription,
  checkFeaturePermission,
};
