const ResidentMealPlan = require("../models/ResidentMealPlan");
const Resident = require("../models/Resident");
const MealPlan = require("../models/MealPlan");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function assignResidentMealPlan(data, userContext = {}) {
  const hostelId = userContext.hostelId || data.hostelId;
  if (!hostelId) throw new Error("Hostel context required for meal plan assignment");
  if (!data.residentId) throw new Error("Resident ID is required");
  if (!data.mealPlanId) throw new Error("Meal Plan ID is required");

  // Verify resident belongs to this active hostel
  const resident = await Resident.findOne({ _id: data.residentId, hostelId, isDeleted: false });
  if (!resident) {
    throw new Error("Resident not found in active hostel");
  }

  // Verify meal plan belongs to this active hostel and is Active
  const mealPlan = await MealPlan.findOne({ _id: data.mealPlanId, hostelId, status: "Active" });
  if (!mealPlan) {
    throw new Error("Active meal plan not found in this hostel");
  }

  // Validate dates
  const effectiveFrom = data.effectiveFrom ? new Date(data.effectiveFrom) : new Date();
  if (isNaN(effectiveFrom.getTime())) {
    throw new Error("Invalid effectiveFrom date");
  }
  let effectiveTo = null;
  if (data.effectiveTo) {
    effectiveTo = new Date(data.effectiveTo);
    if (isNaN(effectiveTo.getTime())) {
      throw new Error("Invalid effectiveTo date");
    }
    if (effectiveTo <= effectiveFrom) {
      throw new Error("effectiveTo date must be after effectiveFrom date");
    }
  }

  // Deactivate any currently active meal plan for resident, preserving history
  await ResidentMealPlan.updateMany(
    { hostelId, residentId: data.residentId, status: "Active" },
    { $set: { status: "Expired", effectiveTo: new Date() } }
  );

  const planAssignment = await ResidentMealPlan.create({
    tenantId: hostelId,
    hostelId,
    residentId: resident._id,
    mealPlanId: mealPlan._id,
    effectiveFrom,
    effectiveTo,
    status: "Active",
    remarks: data.remarks || "",
  });

  // Also update resident's foodPreference for quick visibility across staff/kitchen dashboards
  let foodPref = "Veg";
  if (mealPlan.mealType === "Non-Vegetarian") foodPref = "Non-Veg";
  else if (mealPlan.mealType === "Mixed") foodPref = "Veg";
  await Resident.findByIdAndUpdate(resident._id, { foodPreference: foodPref });

  await AuditLog.create({
    hostelId,
    userId: userContext.userId || null,
    action: `Assigned Meal Plan '${mealPlan.planName}' to resident ${resident.fullName}`,
    actionType: "ASSIGN_MEAL_PLAN",
    entity: "MealPlan",
    targetId: planAssignment._id,
    targetModel: "ResidentMealPlan",
    details: {
      residentId: resident._id,
      residentName: resident.fullName,
      planName: mealPlan.planName,
      monthlyCharge: mealPlan.monthlyCharge,
      effectiveFrom,
    },
    ipAddress: userContext.ip || "",
    timestamp: new Date(),
  }).catch(() => {});

  return planAssignment;
}

async function getResidentMealPlan(residentId, hostelId = null) {
  const query = { residentId, status: "Active" };
  if (hostelId) query.hostelId = hostelId;
  return await ResidentMealPlan.findOne(query).populate("mealPlanId");
}

async function listResidentMealPlans({ hostelId, residentId, status, page = 1, limit = 50 }) {
  if (!hostelId) throw new Error("Hostel context required");

  const query = { hostelId };
  if (residentId) query.residentId = residentId;
  if (status && status !== "ALL") query.status = status;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [assignments, total] = await Promise.all([
    ResidentMealPlan.find(query)
      .populate("residentId", "fullName phone admissionNumber status")
      .populate("mealPlanId", "planName planCode mealType monthlyCharge")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    ResidentMealPlan.countDocuments(query),
  ]);

  return {
    assignments,
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}

async function cancelResidentMealPlan(assignmentId, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel context required");

  const assignment = await ResidentMealPlan.findOne({ _id: assignmentId, hostelId, status: "Active" });
  if (!assignment) {
    throw new Error("Active meal plan assignment not found in active hostel");
  }

  assignment.status = "Cancelled";
  assignment.effectiveTo = new Date();
  await assignment.save();

  await AuditLog.create({
    hostelId,
    userId: userContext.userId || null,
    action: `Cancelled Meal Plan assignment ${assignmentId}`,
    actionType: "CANCEL_MEAL_PLAN",
    entity: "MealPlan",
    targetId: assignment._id,
    targetModel: "ResidentMealPlan",
    ipAddress: userContext.ip || "",
    timestamp: new Date(),
  }).catch(() => {});

  return assignment;
}

module.exports = {
  assignResidentMealPlan,
  getResidentMealPlan,
  listResidentMealPlans,
  cancelResidentMealPlan,
};
