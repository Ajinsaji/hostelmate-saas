const ResidentMealPlan = require("../models/ResidentMealPlan");
const { logger } = require("../utils/logger");

async function assignResidentMealPlan(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Deactivate existing active meal plan for resident
  await ResidentMealPlan.updateMany(
    { hostelId, residentId: data.residentId, status: "Active" },
    { $set: { status: "Expired", effectiveTo: new Date() } }
  );

  const planAssignment = await ResidentMealPlan.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    status: "Active",
  });
  return planAssignment;
}

async function getResidentMealPlan(residentId) {
  return await ResidentMealPlan.findOne({ residentId, status: "Active" }).populate("mealPlanId");
}

module.exports = {
  assignResidentMealPlan,
  getResidentMealPlan,
};
