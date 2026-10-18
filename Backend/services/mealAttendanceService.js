const MealAttendance = require("../models/MealAttendance");
const Resident = require("../models/Resident");
const Recipe = require("../models/Recipe");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const { logger } = require("../utils/logger");

async function recordMealAttendance(data, userContext = {}) {
  const hostelId = userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const attendanceDate = data.attendanceDate ? new Date(data.attendanceDate) : new Date();
  if (Number.isNaN(attendanceDate.getTime())) throw new Error("Invalid attendance date");
  attendanceDate.setUTCHours(0, 0, 0, 0);

  if (!data.residentId) throw new Error("Resident ID is required");
  const resident = await Resident.findOne({ _id: data.residentId, hostelId, isDeleted: false }).select("_id").lean();
  if (!resident) throw new Error("Resident not found in this hostel");

  const attendanceKey = { hostelId, attendanceDate, meal: data.meal, residentId: resident._id };
  let record = await MealAttendance.findOne(attendanceKey);
  let isNewAttendance = !record;
  if (record) {
    record.status = data.status;
    record.guestName = data.guestName || "";
    record.extraMealCharge = data.extraMealCharge || 0;
    record.recordedBy = userContext.userId || null;
    await record.save();
  } else {
    try {
      record = await MealAttendance.create({
        ...data,
        ...attendanceKey,
        tenantId: hostelId,
        recordedBy: userContext.userId || null,
      });
    } catch (error) {
      // The unique index is the final guard against concurrent duplicate inserts.
      if (error.code !== 11000) throw error;
      isNewAttendance = false;
      record = await MealAttendance.findOne(attendanceKey);
      if (!record) throw error;
      record.status = data.status;
      record.guestName = data.guestName || "";
      record.extraMealCharge = data.extraMealCharge || 0;
      record.recordedBy = userContext.userId || null;
      await record.save();
    }
  }

  // Automated Inventory Consumption trigger based on Recipe matching meal type
  if (isNewAttendance && (record.status === "Present" || record.status === "Guest Meal" || record.status === "Extra Meal")) {
    try {
      const recipe = await Recipe.findOne({ hostelId, mealType: record.meal, status: "Active" });
      if (recipe && Array.isArray(recipe.ingredients)) {
        for (const ing of recipe.ingredients) {
          const item = await InventoryItem.findOne({ _id: ing.ingredientId, hostelId });
          if (item) {
            const qty = ing.quantityPerServing || 0.1;
            const updatedItem = await InventoryItem.findOneAndUpdate(
              { _id: item._id, hostelId, currentStock: { $gte: qty } },
              [{ $set: {
                currentStock: { $subtract: ["$currentStock", qty] },
                status: { $switch: {
                  branches: [
                    { case: { $lte: [{ $subtract: ["$currentStock", qty] }, 0] }, then: "Out of Stock" },
                    { case: { $lte: [{ $subtract: ["$currentStock", qty] }, "$reorderLevel"] }, then: "Low Stock" },
                  ],
                  default: "In Stock",
                } },
              } }],
              { new: true }
            );
            if (!updatedItem) continue;

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
  if (!hostelId) throw new Error("Hostel ID is required");
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(targetDate.getTime())) throw new Error("Invalid attendance date");
  targetDate.setUTCHours(0, 0, 0, 0);

  const nextDate = new Date(targetDate);
  nextDate.setUTCDate(nextDate.getUTCDate() + 1);
  const query = { hostelId, attendanceDate: { $gte: targetDate, $lt: nextDate } };
  if (meal) query.meal = meal;

  return await MealAttendance.find(query)
    .populate("residentId", "fullName admissionNumber")
    .sort({ attendanceDate: -1 });
}

module.exports = {
  recordMealAttendance,
  getAttendanceForDate,
};
