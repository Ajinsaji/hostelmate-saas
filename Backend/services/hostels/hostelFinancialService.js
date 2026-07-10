const mongoose = require("mongoose");

const Payment = require("../../models/Payment");

/**
 * Financials for a hostel (no hardcoded values, uses Mongo aggregation).
 * @param {string|mongoose.Types.ObjectId} hostelId
 */
async function getHostelFinancials(hostelId) {
  if (!hostelId) return null;

  const hostelObjectId = mongoose.Types.ObjectId.isValid(hostelId)
    ? new mongoose.Types.ObjectId(hostelId)
    : null;

  if (!hostelObjectId) return null;

  const [agg] = await Payment.aggregate([
    { $match: { hostelId: hostelObjectId } },
    {
      $facet: {
        summary: [
          {
            $group: {
              _id: null,
              totalPayments: { $sum: 1 },
              paidAmountTotal: { $sum: { $ifNull: ["$paidAmount", 0] } },
              cashAmountTotal: { $sum: { $ifNull: ["$cashAmount", 0] } },
              onlineAmountTotal: { $sum: { $ifNull: ["$onlineAmount", 0] } },
              balanceTotal: { $sum: { $ifNull: ["$balance", 0] } },
              monthCount: { $addToSet: "$month" },
            },
          },
          {
            $project: {
              _id: 0,
              totalPayments: 1,
              paidAmountTotal: 1,
              cashAmountTotal: 1,
              onlineAmountTotal: 1,
              balanceTotal: 1,
              months: { $size: "$monthCount" },
            },
          },
        ],
        history: [
          { $sort: { createdAt: -1 } },
          {
            $project: {
              _id: 1,
              month: 1,
              totalRent: { $ifNull: ["$totalRent", 0] },
              paidAmount: { $ifNull: ["$paidAmount", 0] },
              balance: { $ifNull: ["$balance", 0] },
              status: 1,
              paymentMethod: 1,
              cashAmount: { $ifNull: ["$cashAmount", 0] },
              onlineAmount: { $ifNull: ["$onlineAmount", 0] },
              createdAt: 1,
              updatedAt: 1,
            },
          },
          { $limit: 24 },
        ],
      },
    },
  ]);

  const summary = agg?.summary?.[0] || {
    totalPayments: 0,
    paidAmountTotal: 0,
    cashAmountTotal: 0,
    onlineAmountTotal: 0,
    balanceTotal: 0,
    months: 0,
  };

  const history = agg?.history || [];

  return {
    summary,
    history,
  };
}

module.exports = {
  getHostelFinancials,
};

