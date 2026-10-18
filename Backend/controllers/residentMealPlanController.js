const residentMealPlanService = require("../services/residentMealPlanService");
const { assignResidentMealPlanSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const assignMealPlan = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = assignResidentMealPlanSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const assignment = await residentMealPlanService.assignResidentMealPlan(value, userCtx);
    return res.status(200).json({ success: true, message: "Meal Plan Assigned to Resident", assignment });
  } catch (err) {
    logger.error("assignMealPlan error:", err);
    return res.status(400).json({ success: false, message: err.message || "Assignment failed" });
  }
};

const getResidentPlan = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const plan = await residentMealPlanService.getResidentMealPlan(req.params.residentId, userCtx.hostelId);
    return res.status(200).json({ success: true, plan });
  } catch (err) {
    logger.error("getResidentPlan error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const listResidentMealPlans = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await residentMealPlanService.listResidentMealPlans({
      hostelId: userCtx.hostelId,
      residentId: req.query.residentId,
      status: req.query.status,
      page: req.query.page,
      limit: req.query.limit,
    });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    logger.error("listResidentMealPlans error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

const cancelResidentMealPlan = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const assignment = await residentMealPlanService.cancelResidentMealPlan(req.params.id, userCtx);
    return res.status(200).json({ success: true, message: "Meal Plan Assignment Cancelled", assignment });
  } catch (err) {
    logger.error("cancelResidentMealPlan error:", err);
    return res.status(400).json({ success: false, message: err.message || "Cancellation failed" });
  }
};

module.exports = {
  assignMealPlan,
  getResidentPlan,
  listResidentMealPlans,
  cancelResidentMealPlan,
};
