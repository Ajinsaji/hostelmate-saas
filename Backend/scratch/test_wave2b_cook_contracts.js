const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Menu = require("../models/Menu");
const MealAttendance = require("../models/MealAttendance");
const Resident = require("../models/Resident");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const WasteLog = require("../models/WasteLog");
const Recipe = require("../models/Recipe");

const menuService = require("../services/menuService");
const mealAttendanceService = require("../services/mealAttendanceService");
const inventoryService = require("../services/inventoryService");
const wasteService = require("../services/wasteService");
const kitchenAuth = require("../middleware/kitchenAuth");
const { getStaffDashboard } = require("../controllers/staffController");

const {
  createMenuSchema,
  recordAttendanceSchema,
  adjustInventoryStockSchema,
  recordWasteSchema,
} = require("../validations/foodValidation");

async function run() {
  let assertions = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    assertions += 1;
  };

  const hostelId = new mongoose.Types.ObjectId().toString();
  const residentId = new mongoose.Types.ObjectId().toString();
  const inventoryId = new mongoose.Types.ObjectId().toString();

  // 1. Role Gate Contract
  check(kitchenAuth.isKitchenRole("Cook"), "Cook role is authorized");
  check(kitchenAuth.isKitchenRole("cook"), "lowercase Cook role is authorized");
  check(kitchenAuth.isKitchenRole("Warden"), "Warden kitchen access is retained");
  check(kitchenAuth.isKitchenRole("owner"), "Owner kitchen access is retained");
  check(!kitchenAuth.isKitchenRole("Accountant"), "Accountant cannot use kitchen operation endpoints");

  // 2. Food & Kitchen Validation Schemas
  check(Boolean(recordAttendanceSchema.validate({ meal: "Lunch" }).error), "Attendance requires a resident id");
  check(Boolean(recordAttendanceSchema.validate({ residentId: "invalid", meal: "Lunch" }).error), "Invalid resident id is rejected");
  check(!recordAttendanceSchema.validate({ residentId: new mongoose.Types.ObjectId().toString(), meal: "Snacks" }).error, "Snacks meal attendance is accepted");

  check(!adjustInventoryStockSchema.validate({ delta: -2.5 }).error, "Negative stock adjustments are supported");
  check(Boolean(adjustInventoryStockSchema.validate({ delta: 0 }).error), "Zero stock changes are rejected");

  check(!createMenuSchema.validate({ menuDate: new Date(), breakfast: "Idli", snacks: "Tea & Samosa" }).error, "Menu schema allows snacks field");

  check(Boolean(recordWasteSchema.validate({}).error), "Waste logging requires inventoryItemId and quantity");
  check(!recordWasteSchema.validate({
    inventoryItemId: new mongoose.Types.ObjectId().toString(),
    quantity: 3.5,
    meal: "Dinner",
    reason: "Spoilage"
  }).error, "Valid waste log schema is accepted");

  // 3. Unique Index Partial Filter
  const uniqueAttendanceIndex = MealAttendance.schema.indexes().find(([keys, options]) =>
    keys.hostelId === 1 && keys.attendanceDate === 1 && keys.meal === 1 && keys.residentId === 1 && options.unique
  );
  check(Boolean(uniqueAttendanceIndex), "A unique attendance key is declared");
  check(uniqueAttendanceIndex[1].partialFilterExpression.residentId.$type === "objectId", "Guest/null attendance does not collide with resident uniqueness");

  // 4. Menu Service Isolation & Null Unconfigured State
  let menuQuery;
  Menu.findOne = async (query) => {
    menuQuery = query;
    return null;
  };
  const absentMenu = await menuService.getMenuForDate(hostelId, "2026-10-12");
  check(absentMenu === null, "Unconfigured menu returns null without fake defaults");
  check(String(menuQuery.hostelId) === hostelId, "Menu read is scoped to the resolved hostel");

  // 5. In-Memory Mock Store for Attendance, Inventory, Wastage
  const savedAttendance = [];
  Resident.findOne = (query) => {
    check(String(query.hostelId) === hostelId, "Resident validation is tenant scoped");
    check(String(query._id) === residentId, "Attendance validates the requested resident id");
    return { select: () => ({ lean: async () => ({ _id: residentId }) }) };
  };
  MealAttendance.findOne = async (query) => savedAttendance.find((record) =>
    String(record.hostelId) === String(query.hostelId) &&
    String(record.residentId) === String(query.residentId) &&
    record.meal === query.meal &&
    record.attendanceDate.getTime() === query.attendanceDate.getTime()
  ) || null;
  MealAttendance.create = async (data) => {
    const record = { ...data, _id: new mongoose.Types.ObjectId().toString(), save: async () => {} };
    savedAttendance.push(record);
    return record;
  };
  Recipe.findOne = async () => null;

  const attendanceContext = { hostelId, userId: "cook-user-1" };
  const attendanceInput = {
    residentId,
    meal: "Lunch",
    status: "Present",
    attendanceDate: "2026-10-12T10:00:00.000Z",
  };
  const firstAttendance = await mealAttendanceService.recordMealAttendance(attendanceInput, attendanceContext);
  const updatedAttendance = await mealAttendanceService.recordMealAttendance(
    { ...attendanceInput, status: "Absent" },
    attendanceContext
  );
  check(savedAttendance.length === 1, "Repeated attendance update does not create a duplicate");
  check(firstAttendance._id === updatedAttendance._id, "Attendance update retains original record id");
  check(updatedAttendance.status === "Absent", "Attendance status is updated in the saved record");
  check(String(updatedAttendance.hostelId) === hostelId, "Saved attendance uses the resolved hostel id");

  // 6. Inventory Stock Adjustment Contract
  let stockFilter;
  let transactionRecord;
  InventoryItem.findOneAndUpdate = async (filter) => {
    stockFilter = filter;
    return { _id: inventoryId, hostelId, averageCost: 5.0, currentStock: 25 };
  };
  InventoryTransaction.create = async (doc) => {
    transactionRecord = Array.isArray(doc) ? doc[0] : doc;
    return transactionRecord;
  };
  const updatedItem = await inventoryService.adjustInventoryStock(inventoryId, -5, "Cooking use", { hostelId });
  check(String(stockFilter.hostelId) === hostelId, "Stock update filters by resolved hostel");
  check(Boolean(stockFilter.$expr), "Stock decrement ensures non-negative inventory");
  check(String(updatedItem._id) === inventoryId, "Stock update returns persisted item");
  check(transactionRecord.quantity === -5, "Stock adjustment writes a signed inventory transaction");
  check(String(transactionRecord.hostelId) === hostelId, "Inventory transaction is tenant scoped");

  // Stock underflow prevention
  InventoryItem.findOneAndUpdate = async () => null;
  InventoryItem.exists = async () => true;
  await assert.rejects(
    inventoryService.adjustInventoryStock(inventoryId, -100, "excess", { hostelId }),
    /negative/
  );

  // 7. Waste Logging Contract with Tenant Scoping
  InventoryItem.findOne = async (query) => {
    if (String(query.hostelId) === hostelId && String(query._id) === inventoryId) {
      return {
        _id: inventoryId,
        hostelId,
        averageCost: 10,
        currentStock: 15,
        save: async () => {},
      };
    }
    return null;
  };

  let savedWasteDoc;
  WasteLog.create = async (doc) => {
    savedWasteDoc = { ...doc, _id: new mongoose.Types.ObjectId().toString() };
    return savedWasteDoc;
  };

  // Reject cross-tenant waste logging
  await assert.rejects(
    wasteService.recordWasteLog(
      { inventoryItemId: inventoryId, quantity: 2, meal: "Lunch", reason: "Spoilage" },
      { hostelId: "different-hostel-id", userId: "cook-1" }
    ),
    /not found in this hostel/
  );

  // Valid waste log for same tenant
  const recordedWaste = await wasteService.recordWasteLog(
    { inventoryItemId: inventoryId, quantity: 2, meal: "Lunch", reason: "Spoilage" },
    { hostelId, userId: "cook-1" }
  );
  check(String(recordedWaste.hostelId) === hostelId, "Recorded waste is scoped to tenant hostel");
  check(recordedWaste.costImpact === 20, "Waste cost impact calculated accurately (quantity * averageCost)");
  check(transactionRecord.transactionType === "Waste", "Inventory transaction logged for waste deduction");

  // 8. Cook Dashboard Real Aggregations
  let attendanceCountCalls = 0;
  MealAttendance.countDocuments = async (query) => {
    attendanceCountCalls += 1;
    check(String(query.hostelId) === hostelId, "Attendance counts are tenant scoped");
    return 10;
  };
  Resident.countDocuments = async (query) => {
    check(String(query.hostelId) === hostelId, "Resident food preference counts are tenant scoped");
    return 15;
  };
  InventoryItem.countDocuments = async (query) => {
    check(String(query.hostelId) === hostelId, "Low stock count is tenant scoped");
    return 3;
  };
  WasteLog.aggregate = async (pipeline) => {
    check(String(pipeline[0].$match.hostelId) === hostelId, "Waste aggregation is tenant scoped");
    return [{ _id: null, totalKg: 4.8 }];
  };

  const req = {
    user: { role: "Cook", hostelId },
    query: { role: "cook" },
  };
  let responseData;
  const res = {
    status: (code) => {
      check(code === 200, "Dashboard returns 200 OK");
      return {
        json: (data) => {
          responseData = data;
          return data;
        },
      };
    },
  };

  await getStaffDashboard(req, res);
  check(responseData.success === true, "Dashboard response is success");
  check(responseData.stats.breakfast === 10, "Breakfast count aggregated");
  check(responseData.stats.lunch === 10, "Lunch count aggregated");
  check(responseData.stats.snacks === 10, "Snacks count aggregated");
  check(responseData.stats.dinner === 10, "Dinner count aggregated");
  check(responseData.stats.vegCount === 15, "Veg count aggregated");
  check(responseData.stats.nonVegCount === 15, "Non-veg count aggregated");
  check(responseData.stats.lowStockCount === 3, "Low stock count aggregated");
  check(responseData.stats.foodWastageKg === 4.8, "Food wastage kg aggregated");

  console.log(`PASS: Wave 2B Cook Operations contracts (${assertions} assertions; database not connected)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
