const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const getSubscriptionStatus = require("../utils/getSubscriptionStatus");

// Centralized subscription enforcement for owner dashboard access.
// Uses ONLY getSubscriptionStatus() as the lifecycle evaluation engine.
const checkSubscription = async (req, res, next) => {
  try {
    const ownerCtx = req.owner;
    if (!ownerCtx?.hostelId) return next();

    const hostelId = ownerCtx.hostelId;

    const [hostel, subscription] = await Promise.all([
      Hostel.findById(hostelId).lean(),
      Subscription.findOne({ hostelId }).lean(),
    ]);

    if (!hostel) return next();

    const mergedHostel = {
      ...hostel,
      ...(subscription || {}),
      planType: subscription?.planType || hostel?.planType || "Basic",
      subscriptionStatus:
        subscription?.subscriptionStatus || hostel?.subscriptionStatus || "inactive",
      subscriptionStartDate:
        subscription?.subscriptionStartDate || hostel?.subscriptionStartDate || null,
      subscriptionEndDate:
        subscription?.subscriptionEndDate || hostel?.subscriptionEndDate || null,
      isFreeAccess:
        subscription?.isFreeAccess !== undefined
          ? subscription.isFreeAccess
          : hostel?.isFreeAccess,
      isTrial:
        subscription?.isTrial !== undefined ? subscription.isTrial : hostel?.isTrial,
    };

    const lifecycle = getSubscriptionStatus(mergedHostel);

    // Allow when freeAccess OR active/trial (trial will return status==='trial').
    if (lifecycle.freeAccess === true || lifecycle.status === "active" || lifecycle.status === "trial") {
      return next();
    }

    return res.status(403).json({
      success: false,
      subscriptionExpired: true,
      message: "Subscription expired",
    });
  } catch (err) {
    // Fail-open to avoid accidental lockouts.
    console.error("checkSubscription error:", err);
    return next();
  }
};

module.exports = checkSubscription;



