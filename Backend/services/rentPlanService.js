const RentPlan = require("../models/RentPlan");
const { logger } = require("../utils/logger");

async function createRentPlan(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const plan = await RentPlan.create({
    ...data,
    tenantId: hostelId,
    hostelId,
  });
  return plan;
}

async function updateRentPlan(planId, updateData) {
  return await RentPlan.findByIdAndUpdate(planId, updateData, { new: true });
}

async function getRentPlans(hostelId) {
  return await RentPlan.find({ hostelId, isDeleted: false }).sort({ createdAt: -1 });
}

module.exports = {
  createRentPlan,
  updateRentPlan,
  getRentPlans,
};
