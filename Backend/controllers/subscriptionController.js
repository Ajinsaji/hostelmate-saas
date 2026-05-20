const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const getSubscriptionStatus = require("../utils/getSubscriptionStatus");

// Centralized subscription lifecycle endpoint.
// Provides lifecycle fields for dashboard gating/UX decisions.
const getSubscriptionStatusEndpoint = async (req, res) => {
  try {
    const owner = req.owner;
    if (!owner?.hostelId) {
      return res.status(200).json({
        success: true,
        status: "inactive",
        daysLeft: null,
        warningLevel: "none",
        expiryDate: null,
        renewalRequired: false,
      });
    }

    const hostelId = owner.hostelId;

    const [hostel, subscription] = await Promise.all([
      Hostel.findById(hostelId).lean(),
      Subscription.findOne({ hostelId }).lean(),
    ]);

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Merge subscription values over hostel values to normalize lifecycle inputs.
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

    return res.status(200).json({
      success: true,
      status: lifecycle.status,
      daysLeft: lifecycle.daysLeft,
      warningLevel: lifecycle.warningLevel,
      expiryDate: lifecycle.expiryDate ? lifecycle.expiryDate.toISOString() : null,
      renewalRequired: lifecycle.renewalRequired,
      planType: mergedHostel.planType,
      subscriptionPlan: mergedHostel.planType,
      subscriptionStatus: mergedHostel.subscriptionStatus,
      subscriptionStartDate: mergedHostel.subscriptionStartDate
        ? mergedHostel.subscriptionStartDate.toISOString()
        : null,
      subscriptionEndDate: mergedHostel.subscriptionEndDate
        ? mergedHostel.subscriptionEndDate.toISOString()
        : null,
      isFreeAccess: mergedHostel.isFreeAccess === true,
      isTrial: mergedHostel.isTrial === true,
    });
  } catch (e) {
    console.error("getSubscriptionStatus error:", e);
    // fail open: unblock UI rather than lock it out
    return res.status(200).json({
      success: true,
      status: "inactive",
      daysLeft: null,
      warningLevel: "none",
      expiryDate: null,
      renewalRequired: false,
    });
  }
};

module.exports = { getSubscriptionStatus: getSubscriptionStatusEndpoint };


