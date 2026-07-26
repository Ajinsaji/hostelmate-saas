const MealAttendance = require("../models/MealAttendance");
const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const { logger } = require("../utils/logger");

async function recordMealAttendance(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const attendanceDate = data.attendanceDate ? new Date(data.attendanceDate) : new Date();

  const record = await MealAttendance.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    attendanceDate,
    recordedBy: userContext.userId || null,
  });

  // Automated Inventory Consumption trigger based on Recipe matching meal type
  if (record.status === "Present" || record.status === "Guest Meal" || record.status === "Extra Meal") {
    try {
      const recipe = await Recipe.findOne({ hostelId, mealType: record.meal, status: "Active" });
      if (recipe && Array.isArray(recipe.ingredients)) {
        for (const ing of recipe.ingredients) {
          const item = await InventoryItem.findById(ing.ingredientId);
          if (item) {
            const qty = ing.quantityPerServing || 0.1;
            item.currentStock = Math.max(0, item.currentStock - qty);
            await item.save();

            await InventoryTransaction.create({
              tenantId: hostelId,
              hostelId,
              inventoryItemId: item._id,
              transactionType: "Consumption",
              quantity: qty,
              unitCost: item.averageCost,
              referenceType: "MealAttendance",
              referenceId: record._id,
              remarks: `Consumption for ${record.meal} (${record.status})`,
            });
          }
        }
      }
    } catch (cErr) {
      logger.error("Error performing automated inventory consumption:", cErr);
    }
  }

  return record;
}

async function getAttendanceForDate(hostelId, dateStr, meal) {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(0, 0, 0, 0);

  const query = { hostelId, attendanceDate: { $gte: targetDate } };
  if (meal) query.meal = meal;

  return await MealAttendance.find(query)
    .populate("residentId", "fullName admissionNumber")
    .sort({ attendanceDate: -1 });
}

module.exports = {
  recordMealAttendance,
  getAttendanceForDate,
};
