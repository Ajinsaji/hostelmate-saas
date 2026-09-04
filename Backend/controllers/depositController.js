const depositService = require("../services/depositService");
const { depositSchema, refundSchema } = require("../validations/rentValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.context?.hostelId || req.owner?.hostelId || req.user?.hostelId,
    workspaceId: req.context?.workspaceId || req.owner?.workspaceId,
    userId: req.context?.userId || req.owner?.ownerId || req.owner?._id || req.user?._id || req.user?.userId,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const receiveDeposit = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = depositSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const deposit = await depositService.receiveDeposit(value, userCtx);
    return res.status(201).json({ success: true, message: "Security Deposit Received", deposit });
  } catch (err) {
    logger.error("receiveDeposit error:", err);
    return res.status(400).json({ success: false, message: err.message || "Deposit recording failed" });
  }
};

const refundDeposit = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = refundSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const deposit = await depositService.refundDeposit(value, userCtx);
    return res.status(200).json({ success: true, message: "Security Deposit Refund Processed", deposit });
  } catch (err) {
    logger.error("refundDeposit error:", err);
    return res.status(400).json({ success: false, message: err.message || "Refund processing failed" });
  }
};

const getDeposits = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const deposits = await depositService.getDepositsList(userCtx.hostelId, req.query.residentId);
    return res.status(200).json({ success: true, deposits });
  } catch (err) {
    logger.error("getDeposits error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  receiveDeposit,
  refundDeposit,
  getDeposits,
};
