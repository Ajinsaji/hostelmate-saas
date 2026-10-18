const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Menu = require("../models/Menu");
const MealAttendance = require("../models/MealAttendance");
const Resident = require("../models/Resident");
const InventoryItem = require("../models/InventoryItem");
const InventoryTransaction = require("../models/InventoryTransaction");
const Recipe = require("../models/Recipe");
const menuService = require("../services/menuService");
const mealAttendanceService = require("../services/mealAttendanceService");
const inventoryService = require("../services/inventoryService");
const kitchenAuth = require("../middleware/kitchenAuth");
const {
  recordAttendanceSchema,
  adjustInventoryStockSchema,
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

  // Role gate contract: kitchen staff and existing owner/Warden access are permitted; Accountant is not.
  check(kitchenAuth.isKitchenRole("Cook"), "Cook role is authorized");
  check(kitchenAuth.isKitchenRole("cook"), "lowercase Cook role is authorized");
  check(kitchenAuth.isKitchenRole("Warden"), "Warden kitchen access is retained");
  check(kitchenAuth.isKitchenRole("owner"), "Owner kitchen access is retained");
  check(!kitchenAuth.isKitchenRole("Accountant"), "Accountant cannot use kitchen operation endpoints");

  // Request schema validation does not allow missing/invalid resident IDs or zero stock changes.
  check(Boolean(recordAttendanceSchema.validate({ meal: "Lunch" }).error), "Attendance requires a resident id");
  check(Boolean(recordAttendanceSchema.validate({ residentId: "not-an-id", meal: "Lunch" }).error), "Invalid resident id is rejected");
  check(!adjustInventoryStockSchema.validate({ delta: -1 }).error, "Negative stock adjustments are supported");
  check(Boolean(adjustInventoryStockSchema.validate({ delta: 0 }).error), "Zero stock changes are rejected");

  // Attendance records are uniquely indexed by hostel, day, meal, and resident.
  const uniqueAttendanceIndex = MealAttendance.schema.indexes().find(([keys, options]) =>
    keys.hostelId === 1 && keys.attendanceDate === 1 && keys.meal === 1 && keys.residentId === 1 && options.unique
  );
  check(Boolean(uniqueAttendanceIndex), "A unique attendance key is declared");
  check(uniqueAttendanceIndex[1].partialFilterExpression.residentId.$type === "objectId", "Guest/null attendance does not collide with resident uniqueness");

  // Missing menu is represented as null rather than seeded/fabricated data.
  let menuQuery;
  Menu.findOne = async (query) => {
    menuQuery = query;
    return null;
  };
  const absentMenu = await menuService.getMenuForDate(hostelId, "2026-10-11");
  check(absentMenu === null, "Unconfigured menu remains empty");
  check(String(menuQuery.hostelId) === hostelId, "Menu read is scoped to the resolved hostel");

  // Backing stores used below are in-memory stubs only; this suite never opens a MongoDB connection.
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

  const attendanceContext = { hostelId, userId: "cook-user" };
  const attendanceInput = {
    residentId,
    meal: "Lunch",
    status: "Present",
    attendanceDate: "2026-10-11T10:00:00.000Z",
  };
  const firstAttendance = await mealAttendanceService.recordMealAttendance(attendanceInput, attendanceContext);
  const updatedAttendance = await mealAttendanceService.recordMealAttendance(
    { ...attendanceInput, status: "Absent" },
    attendanceContext
  );
  check(savedAttendance.length === 1, "Repeated attendance update does not create a duplicate");
  check(firstAttendance._id === updatedAttendance._id, "Attendance update retains its record id");
  check(updatedAttendance.status === "Absent", "Attendance status is updated in the saved record");
  check(String(updatedAttendance.hostelId) === hostelId, "Saved attendance uses the resolved hostel id");

  let attendanceQuery;
  MealAttendance.find = (query) => {
    attendanceQuery = query;
    return { populate: () => ({ sort: async () => [] }) };
  };
  await mealAttendanceService.getAttendanceForDate(hostelId, "2026-10-11", "Lunch");
  check(String(attendanceQuery.hostelId) === hostelId, "Attendance read is tenant scoped");
  check(attendanceQuery.attendanceDate.$lt > attendanceQuery.attendanceDate.$gte, "Attendance read has an exclusive next-day bound");
  check(attendanceQuery.meal === "Lunch", "Attendance read is meal-period scoped");

  // Stock changes use atomic tenant filters and persist a matching ledger entry.
  let stockFilter;
  let transactionRecord;
  InventoryItem.findOneAndUpdate = async (filter) => {
    stockFilter = filter;
    return { _id: inventoryId, hostelId, averageCost: 4.5, currentStock: 12 };
  };
  InventoryTransaction.create = async (doc) => {
    transactionRecord = Array.isArray(doc) ? doc[0] : doc;
    return transactionRecord;
  };
  const updatedItem = await inventoryService.adjustInventoryStock(inventoryId, -2, "test adjustment", { hostelId });
  check(String(stockFilter.hostelId) === hostelId, "Stock update filters by resolved hostel");
  check(Boolean(stockFilter.$expr), "Stock decrement cannot make quantity negative");
  check(String(updatedItem._id) === inventoryId, "Stock update returns persisted item");
  check(transactionRecord.quantity === -2, "Stock adjustment writes a signed inventory transaction");
  check(String(transactionRecord.hostelId) === hostelId, "Inventory transaction is tenant scoped");

  let missingItemFilter;
  InventoryItem.findOneAndUpdate = async (filter) => {
    missingItemFilter = filter;
    return null;
  };
  InventoryItem.exists = async (filter) => {
    check(String(filter.hostelId) === hostelId, "Stock existence check remains tenant scoped");
    return true;
  };
  await assert.rejects(
    inventoryService.adjustInventoryStock(inventoryId, -20, "too much", { hostelId }),
    /negative/
  );
  check(Boolean(missingItemFilter.$expr), "Excess decrement is rejected by the atomic stock filter");

  console.log(`PASS: Cook Operations contracts (${assertions} assertions; database not connected)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});