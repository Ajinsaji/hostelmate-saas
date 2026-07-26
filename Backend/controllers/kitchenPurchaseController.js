const purchaseService = require("../services/kitchenPurchaseService");
const { recordPurchaseSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const recordPurchase = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = recordPurchaseSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const purchase = await purchaseService.recordKitchenPurchase(value, userCtx);
    return res.status(201).json({ success: true, message: "Kitchen Purchase Recorded & Expense Created", purchase });
  } catch (err) {
    logger.error("recordPurchase error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to record purchase" });
  }
};

const getPurchases = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const purchases = await purchaseService.getKitchenPurchases(userCtx.hostelId);
    return res.status(200).json({ success: true, purchases });
  } catch (err) {
    logger.error("getPurchases error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  recordPurchase,
  getPurchases,
};
