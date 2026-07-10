const mongoose = require("mongoose");

const Subscription = require("../../models/Subscription");

/**
 * Subscription details for a hostel (no hardcoded values, uses Mongo aggregation).
 * @param {string|mongoose.Types.ObjectId} hostelId
 */
async function getHostelSubscription(hostelId) {
  if (!hostelId) return null;

  const hostelObjectId = mongoose.Types.ObjectId.isValid(hostelId)
    ? new mongoose.Types.ObjectId(hostelId)
    : null;

  if (!hostelObjectId) return null;

  const subAgg = await Subscription.aggregate([
    { $match: { hostelId: hostelObjectId } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: "$hostelId",
        latest: { $first: "$$ROOT" },
        history: {
          $push: {
            _id: "$_id",
            planType: "$planType",
            subscriptionStatus: "$subscriptionStatus",
            isTrial: "$isTrial",
            subscriptionStartDate: "$subscriptionStartDate",
            subscriptionEndDate: "$subscriptionEndDate",
            isFreeAccess: "$isFreeAccess",
            amount: "$amount",
            notes: "$notes",
            createdAt: "$createdAt",
            updatedAt: "$updatedAt",
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        latest: 1,
        history: { $slice: ["$history", 12] },
      },
    },
  ]);

  const result = subAgg?.[0];
  if (!result) return null;

  const latest = result.latest || {};
  const history = result.history || [];

  return {
    planType: latest.planType,
    subscriptionStatus: latest.subscriptionStatus,
    isTrial: latest.isTrial,
    isFreeAccess: latest.isFreeAccess,
    residentLimit: latest.residentLimit,
    currentResidentCount: latest.currentResidentCount,
    trialStartDate: latest.trialStartDate,
    trialEndDate: latest.trialEndDate,
    subscriptionStartDate: latest.subscriptionStartDate,
    subscriptionEndDate: latest.subscriptionEndDate,
    amount: latest.amount,
    paymentMethod: latest.paymentMethod,
    transactionId: latest.transactionId,
    notes: latest.notes,
    history,
  };
}

module.exports = {
  getHostelSubscription,
};

