const MealPlan = require("../models/MealPlan");
const { logger } = require("../utils/logger");

const DEFAULT_MEAL_PLANS = [
  { planName: "Standard Veg Plan", planCode: "VEG-STD", mealType: "Vegetarian", monthlyCharge: 3000, description: "3 meals daily vegetarian menu", isDefault: true },
  { planName: "Non-Veg Premium Plan", planCode: "NONVEG-PREM", mealType: "Non-Vegetarian", monthlyCharge: 4500, description: "Includes eggs and non-veg meals 3 days a week", isDefault: false },
  { planName: "Mixed Flexi Plan", planCode: "MIX-FLEX", mealType: "Mixed", monthlyCharge: 3800, description: "Flexible meal options", isDefault: false },
];

async function seedDefaultMealPlans(hostelId) {
  const count = await MealPlan.countDocuments({ hostelId });
  if (count > 0) return;

  const docs = DEFAULT_MEAL_PLANS.map((mp) => ({
    tenantId: hostelId,
    hostelId,
    ...mp,
  }));
  await MealPlan.insertMany(docs);
  logger.info(`Seeded default meal plans for hostel ${hostelId}`);
}

async function createMealPlan(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  await seedDefaultMealPlans(hostelId);

  const plan = await MealPlan.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });
  return plan;
}

async function getMealPlans(hostelId) {
  await seedDefaultMealPlans(hostelId);
  return await MealPlan.find({ hostelId, status: "Active" }).sort({ createdAt: -1 });
}

module.exports = {
  seedDefaultMealPlans,
  createMealPlan,
  getMealPlans,
};
