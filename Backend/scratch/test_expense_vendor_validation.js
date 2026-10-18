const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const Expense = require("../models/Expense");
const Vendor = require("../models/Vendor");
const FinancialPeriod = require("../models/FinancialPeriod");
const Budget = require("../models/Budget");
const AuditLog = require("../models/AuditLog");
const expenseService = require("../services/expenseService");
const { createExpenseSchema } = require("../validations/expenseValidation");

async function run() {
  let assertions = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    assertions += 1;
  };

  console.log("============================================================");
  console.log("  HOSTELMATE EXPENSE VENDOR VALIDATION REGRESSION SUITE");
  console.log("============================================================\n");

  const hostelA = new mongoose.Types.ObjectId().toString();
  const hostelB = new mongoose.Types.ObjectId().toString();
  const vendorA = new mongoose.Types.ObjectId().toString();
  const vendorB = new mongoose.Types.ObjectId().toString();
  const categoryA = new mongoose.Types.ObjectId().toString();

  // Mock global dependencies
  FinancialPeriod.findOne = async () => null;
  Budget.findOne = () => ({ populate: async () => null });
  AuditLog.create = async () => null;

  // Mock Vendor.findOne for tenant isolation tests
  Vendor.findOne = async (query) => {
    if (String(query._id) === vendorA && String(query.hostelId) === hostelA) {
      return { _id: vendorA, hostelId: hostelA, vendorName: "Shree Supplies" };
    }
    if (String(query._id) === vendorB && String(query.hostelId) === hostelB) {
      return { _id: vendorB, hostelId: hostelB, vendorName: "Cross Hostel Vendor" };
    }
    return null;
  };

  // --- SCENARIO 1: Optional vendor omitted ---
  console.log("--- 1. Optional vendor omitted ---");
  const validNoVendor = {
    categoryId: categoryA,
    title: "Monthly Internet Bill",
    amount: 1500,
    paymentMethod: "UPI",
  };
  const res1 = createExpenseSchema.validate(validNoVendor);
  check(!res1.error, "Joi validates expense when vendor is omitted");

  let createdDoc1 = null;
  Expense.countDocuments = async () => 0;
  Expense.create = async (doc) => {
    createdDoc1 = {
      ...doc,
      _id: new mongoose.Types.ObjectId().toString(),
      netAmount: doc.amount,
      save: async () => {},
    };
    return createdDoc1;
  };

  const exp1 = await expenseService.createExpense(validNoVendor, { hostelId: hostelA, userId: "user-1" });
  check(exp1.vendorId === null, "Service sets vendorId to null when omitted");
  check(String(exp1.hostelId) === hostelA, "Tenant isolation preserved for Hostel A");

  // --- SCENARIO 2: Optional vendor submitted as empty string or whitespace ---
  console.log("--- 2. Optional vendor submitted as empty string / whitespace ---");
  const emptyVendorPayload = {
    categoryId: categoryA,
    title: "Water Dispenser Refill",
    amount: 500,
    vendorId: "",
  };
  const res2 = createExpenseSchema.validate(emptyVendorPayload);
  check(!res2.error, "Joi accepts empty string vendorId");

  const whitespacePayload = {
    categoryId: categoryA,
    title: "Tea & Snacks",
    amount: 200,
    vendorId: "   ",
  };
  const normalizedWhitespace = {
    ...whitespacePayload,
    vendorId: whitespacePayload.vendorId.trim() || null,
  };
  check(!createExpenseSchema.validate(normalizedWhitespace).error, "Trimmed whitespace vendorId is valid");

  const exp2 = await expenseService.createExpense(emptyVendorPayload, { hostelId: hostelA, userId: "user-1" });
  check(exp2.vendorId === null, "Service normalizes empty string vendorId to null");

  const exp2b = await expenseService.createExpense(whitespacePayload, { hostelId: hostelA, userId: "user-1" });
  check(exp2b.vendorId === null, "Service normalizes whitespace vendorId to null");

  // Mongoose schema setter verification
  const schemaExpEmpty = new Expense({
    categoryId: categoryA,
    title: "Direct Schema Test",
    amount: 100,
    vendorId: "",
  });
  check(schemaExpEmpty.vendorId === null, "Expense schema setter casts empty string to null without CastError");

  const schemaExpWhitespace = new Expense({
    categoryId: categoryA,
    title: "Direct Schema Test 2",
    amount: 100,
    vendorId: "   ",
  });
  check(schemaExpWhitespace.vendorId === null, "Expense schema setter casts whitespace to null without CastError");

  // --- SCENARIO 3: Valid vendor belonging to the same hostel ---
  console.log("--- 3. Valid vendor belonging to the same hostel ---");
  const validSameHostelPayload = {
    categoryId: categoryA,
    title: "Bulk Rice Purchase",
    amount: 4500,
    vendorId: vendorA,
  };
  const res3 = createExpenseSchema.validate(validSameHostelPayload);
  check(!res3.error, "Joi accepts valid 24-char hex vendorId");

  const exp3 = await expenseService.createExpense(validSameHostelPayload, { hostelId: hostelA, userId: "user-1" });
  check(String(exp3.vendorId) === vendorA, "Valid vendor from same hostel is accepted and attached");

  // --- SCENARIO 4: Invalid vendor ID format ---
  console.log("--- 4. Invalid vendor ID format ---");
  const invalidHexPayload = {
    categoryId: categoryA,
    title: "Hardware Tools",
    amount: 750,
    vendorId: "not-a-valid-hex-id",
  };
  const res4 = createExpenseSchema.validate(invalidHexPayload);
  check(Boolean(res4.error), "Joi rejects malformed non-hex vendorId");

  await assert.rejects(
    expenseService.createExpense(invalidHexPayload, { hostelId: hostelA, userId: "user-1" }),
    /Invalid vendor ID format/,
    "Service rejects invalid vendor ID format"
  );

  // --- SCENARIO 5: Vendor belonging to another hostel (cross-tenant) ---
  console.log("--- 5. Vendor belonging to another hostel ---");
  const crossHostelPayload = {
    categoryId: categoryA,
    title: "Paint Supplies",
    amount: 3200,
    vendorId: vendorB, // Belongs to hostelB, but we are acting as hostelA
  };
  await assert.rejects(
    expenseService.createExpense(crossHostelPayload, { hostelId: hostelA, userId: "user-1" }),
    /Vendor not found in this hostel/,
    "Cross-tenant vendor is safely rejected"
  );

  // Non-existent vendor in the same hostel
  const nonExistentVendorId = new mongoose.Types.ObjectId().toString();
  await assert.rejects(
    expenseService.createExpense(
      { ...validNoVendor, vendorId: nonExistentVendorId },
      { hostelId: hostelA, userId: "user-1" }
    ),
    /Vendor not found in this hostel/,
    "Non-existent vendor is rejected"
  );

  // --- SCENARIO 6: Missing required fields / business rules ---
  console.log("--- 6. Missing required fields / business rules ---");
  check(Boolean(createExpenseSchema.validate({ amount: 1000 }).error), "Joi requires categoryId and title");
  check(Boolean(createExpenseSchema.validate({ categoryId: categoryA, amount: 1000 }).error), "Joi requires title");
  check(Boolean(createExpenseSchema.validate({ categoryId: categoryA, title: "Test", amount: 0 }).error), "Joi rejects zero amount");
  check(Boolean(createExpenseSchema.validate({ categoryId: categoryA, title: "Test", amount: -50 }).error), "Joi rejects negative amount");

  await assert.rejects(
    expenseService.createExpense({ ...validNoVendor }, {}),
    /Hostel ID is required/,
    "Service requires hostelId context"
  );

  // --- SCENARIO 7: Existing accountant expense workflow and financial side effects ---
  console.log("--- 7. Accountant expense workflow and financial side effects ---");
  let auditRecorded = false;
  AuditLog.create = async (doc) => {
    if (doc && doc.actionType === "CREATE") auditRecorded = true;
    return doc;
  };

  const accountantExpense = await expenseService.createExpense(
    {
      categoryId: categoryA,
      title: "Quarterly Pest Control",
      amount: 2800,
      paymentMethod: "Bank Transfer",
      description: "Full hostel premises treatment",
    },
    { hostelId: hostelA, userId: "acct-user-1", ip: "127.0.0.1" }
  );

  check(accountantExpense.expenseNumber.startsWith("EXP-"), "Expense number auto-generated");
  check(accountantExpense.netAmount === 2800, "Net amount properly assigned");
  check(accountantExpense.status === "Paid", "Default status is Paid");
  check(auditRecorded, "Audit log created for accountant expense");

  // Status transition
  Expense.findOne = async () => accountantExpense;
  const updatedExp = await expenseService.updateExpenseStatus(accountantExpense._id, "Approved", {
    hostelId: hostelA,
    userId: "owner-1",
  });
  check(updatedExp.status === "Approved", "Expense status can be updated");

  // Cross-tenant update rejection
  Expense.findOne = async (query) => {
    if (String(query._id) === String(accountantExpense._id) && String(query.hostelId) === hostelA) {
      return accountantExpense;
    }
    return null;
  };
  await assert.rejects(
    expenseService.updateExpenseStatus(accountantExpense._id, "Cancelled", { hostelId: hostelB, userId: "acct-b" }),
    /Expense not found in this hostel/,
    "Cross-tenant status update rejected"
  );

  console.log("\n============================================================");
  console.log(`✓ ALL 7 SCENARIOS PASSED (${assertions} assertions)`);
  console.log("============================================================\n");
}

run().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
