const rentPlanService = require("../services/rentPlanService");
const { createRentPlanSchema } = require("../validations/rentValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createRentPlan = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createRentPlanSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const plan = await rentPlanService.createRentPlan(value, userCtx);
    return res.status(201).json({ success: true, message: "Rent Plan Created", plan });
  } catch (err) {
    logger.error("createRentPlan error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create plan" });
  }
};

const getRentPlans = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const plans = await rentPlanService.getRentPlans(userCtx.hostelId);
    return res.status(200).json({ success: true, plans });
  } catch (err) {
    logger.error("getRentPlans error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const updateRentPlan = async (req, res) => {
  try {
    const plan = await rentPlanService.updateRentPlan(req.params.id, req.body);
    return res.status(200).json({ success: true, message: "Rent Plan Updated", plan });
  } catch (err) {
    logger.error("updateRentPlan error:", err);
    return res.status(400).json({ success: false, message: err.message || "Update failed" });
  }
};

module.exports = {
  createRentPlan,
  getRentPlans,
  updateRentPlan,
};
