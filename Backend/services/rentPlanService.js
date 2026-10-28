const RentPlan = require("../models/RentPlan");
const { logger } = require("../utils/logger");

async function createRentPlan(data, userContext = {}) {
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  // Prevent client from overriding tenant identity
  const safeData = { ...data };
  delete safeData.tenantId;
  delete safeData.hostelId;

  const plan = await RentPlan.create({
    ...safeData,
    tenantId: hostelId,
    hostelId,
  });
  return plan;
}

async function updateRentPlan(planId, updateData, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required to update rent plan");

  // Prevent mass-assignment tampering of tenant fields
  const safeData = { ...updateData };
  delete safeData.hostelId;
  delete safeData.tenantId;

  const plan = await RentPlan.findOneAndUpdate(
    { _id: planId, hostelId, isDeleted: false },
    { $set: safeData },
    { returnDocument: "after", runValidators: true }
  );

  if (!plan) {
    throw new Error("Rent plan not found or unauthorized");
  }

  return plan;
}

async function getRentPlans(hostelId) {
  if (!hostelId) throw new Error("Hostel ID is required");
  return await RentPlan.find({ hostelId, isDeleted: false }).sort({ createdAt: -1 });
}

module.exports = {
  createRentPlan,
  updateRentPlan,
  getRentPlans,
};
