const assert = require("node:assert/strict");
const mongoose = require("mongoose");

const RentInvoice = require("../models/RentInvoice");
const RentPayment = require("../models/RentPayment");
const Resident = require("../models/Resident");
const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const BankAccount = require("../models/BankAccount");
const VendorInvoice = require("../models/VendorInvoice");
const ResidentLedger = require("../models/ResidentLedger");
const Payment = require("../models/Payment");
const FinancialPeriod = require("../models/FinancialPeriod");
const Budget = require("../models/Budget");
const AuditLog = require("../models/AuditLog");
const Hostel = require("../models/Hostel");

const rentInvoiceService = require("../services/rentInvoiceService");
const rentPaymentService = require("../services/rentPaymentService");
const expenseService = require("../services/expenseService");
const accountantAuth = require("../middleware/accountantAuth");
const { getStaffDashboard } = require("../controllers/staffController");

const {
  createInvoiceSchema,
  recordPaymentSchema,
} = require("../validations/rentValidation");

const {
  createExpenseSchema,
} = require("../validations/expenseValidation");

async function run() {
  let assertions = 0;
  const check = (condition, message) => {
    assert.ok(condition, message);
    assertions += 1;
  };

  const hostelA = new mongoose.Types.ObjectId().toString();
  const hostelB = new mongoose.Types.ObjectId().toString();
  const residentIdA = new mongoose.Types.ObjectId().toString();
  const residentIdB = new mongoose.Types.ObjectId().toString();
  const invoiceIdA = new mongoose.Types.ObjectId().toString();
  const invoiceIdB = new mongoose.Types.ObjectId().toString();
  const expenseIdA = new mongoose.Types.ObjectId().toString();

  FinancialPeriod.findOne = async () => null;
  Budget.findOne = () => ({ populate: async () => null });
  AuditLog.create = async () => null;
  Hostel.findById = async () => ({ hostelName: "Hostel Alpha" });

  // 1. Role Gate Contract: Accountant and Owner are permitted; Cook and Warden are not
  check(accountantAuth.isAccountantRole("Accountant"), "Accountant role is authorized");
  check(accountantAuth.isAccountantRole("accountant"), "lowercase accountant role is authorized");
  check(accountantAuth.isAccountantRole("Owner"), "Owner financial access is authorized");
  check(accountantAuth.isAccountantRole("owner"), "lowercase owner financial access is authorized");
  check(accountantAuth.isAccountantRole("admin"), "Admin financial access is authorized");
  check(!accountantAuth.isAccountantRole("Cook"), "Cook role cannot access accountant operations");
  check(!accountantAuth.isAccountantRole("cook"), "lowercase cook cannot access accountant operations");
  check(!accountantAuth.isAccountantRole("Warden"), "Warden cannot access accountant operations");
  check(!accountantAuth.isAccountantRole("resident"), "Resident cannot access accountant operations");

  // 2. Financial Request Schema Validations
  check(Boolean(recordPaymentSchema.validate({}).error), "Payment requires residentId and amount");
  check(Boolean(recordPaymentSchema.validate({ residentId: residentIdA, amount: 0 }).error), "Zero amount payment is rejected");
  check(Boolean(recordPaymentSchema.validate({ residentId: residentIdA, amount: -500 }).error), "Negative amount payment is rejected");
  check(!recordPaymentSchema.validate({ residentId: residentIdA, amount: 4500, paymentMethod: "UPI" }).error, "Valid payment schema accepted");

  check(Boolean(createInvoiceSchema.validate({ rentAmount: 6000 }).error), "Invoice creation requires residentId");
  check(Boolean(createInvoiceSchema.validate({ residentId: residentIdA, rentAmount: -100 }).error), "Negative rent amount rejected");
  check(!createInvoiceSchema.validate({ residentId: residentIdA, rentAmount: 6000, billingPeriod: "October 2026" }).error, "Valid invoice schema accepted");

  check(Boolean(createExpenseSchema.validate({ amount: 1500 }).error), "Expense creation requires categoryId and title");
  check(!createExpenseSchema.validate({ categoryId: new mongoose.Types.ObjectId().toString(), title: "LPG Gas", amount: 2100 }).error, "Valid expense schema accepted");

  // 3. Rent Invoice Calculations & Duplicate Prevention
  Resident.findOne = async (query) => {
    if (String(query._id) === residentIdA && String(query.hostelId) === hostelA) {
      return { _id: residentIdA, hostelId: hostelA, fullName: "Resident Alpha", monthlyRent: 7000 };
    }
    return null;
  };

  const existingInvoices = [];
  RentInvoice.countDocuments = async () => existingInvoices.length;
  RentInvoice.findOne = async (query) => {
    return existingInvoices.find(
      (inv) =>
        String(inv.hostelId) === String(query.hostelId) &&
        String(inv.residentId) === String(query.residentId) &&
        inv.billingPeriod === query.billingPeriod
    ) || null;
  };

  RentInvoice.create = async (doc) => {
    const inv = {
      ...doc,
      _id: invoiceIdA,
      grandTotal: (doc.rentAmount || 0) + (doc.maintenanceCharge || 0),
      balanceAmount: (doc.rentAmount || 0) + (doc.maintenanceCharge || 0),
      paidAmount: 0,
      paymentStatus: "Pending",
      save: async () => {},
    };
    existingInvoices.push(inv);
    return inv;
  };

  RentPayment.findById = (id) => ({
    populate: () => ({
      populate: async () => null,
    }),
  });

  ResidentLedger.findOne = () => ({ sort: () => null });
  ResidentLedger.create = async (doc) => doc;

  // Tenant Isolation on Invoice Creation: reject resident from different hostel
  await assert.rejects(
    rentInvoiceService.createRentInvoice(
      { residentId: residentIdB, rentAmount: 7000, billingPeriod: "November 2026" },
      { hostelId: hostelA, userId: "acct-1" }
    ),
    /Resident not found in this hostel/
  );

  // Successfully create invoice for valid resident in Hostel A
  const invoiceA = await rentInvoiceService.createRentInvoice(
    { residentId: residentIdA, rentAmount: 7000, maintenanceCharge: 500, billingPeriod: "November 2026" },
    { hostelId: hostelA, userId: "acct-1" }
  );
  check(String(invoiceA.hostelId) === hostelA, "Created invoice is scoped to Hostel A");
  check(invoiceA.grandTotal === 7500, "Grand total sums rent and maintenance charge");
  check(invoiceA.balanceAmount === 7500, "Initial balance due matches grand total");

  // Prevent duplicate invoice creation for same resident and billing period
  await assert.rejects(
    rentInvoiceService.createRentInvoice(
      { residentId: residentIdA, rentAmount: 7000, billingPeriod: "November 2026" },
      { hostelId: hostelA, userId: "acct-1" }
    ),
    /already exists/
  );

  // 4. Payment Recording, Tenant Isolation, Overpayment Prevention & Idempotency
  const savedPayments = [];
  RentPayment.countDocuments = async () => savedPayments.length;
  RentPayment.findOne = async (query) => {
    if (query.createdAt) {
      return savedPayments.find(
        (p) =>
          String(p.hostelId) === String(query.hostelId) &&
          String(p.residentId) === String(query.residentId) &&
          p.amount === query.amount
      ) || null;
    }
    return null;
  };
  RentPayment.create = async (doc) => {
    const payment = {
      ...doc,
      _id: new mongoose.Types.ObjectId().toString(),
      status: "Completed",
      save: async () => {},
    };
    savedPayments.push(payment);
    return payment;
  };

  // Cross-tenant payment rejection: resident belongs to Hostel B, attempted in Hostel A
  await assert.rejects(
    rentPaymentService.recordPayment(
      { residentId: residentIdB, amount: 2000, paymentMethod: "UPI" },
      { hostelId: hostelA, userId: "acct-1" }
    ),
    /Resident not found in this hostel/
  );

  // Cross-tenant invoice allocation rejection: invoice belongs to Hostel B
  RentInvoice.findOne = async (query) => {
    if (String(query._id) === invoiceIdB) {
      // Belongs to Hostel B
      if (String(query.hostelId) === hostelB) {
        return { _id: invoiceIdB, hostelId: hostelB, residentId: residentIdB, balanceAmount: 5000, paymentStatus: "Pending" };
      }
      return null;
    }
    if (String(query._id) === invoiceIdA && String(query.hostelId) === hostelA) {
      return invoiceA;
    }
    return null;
  };

  await assert.rejects(
    rentPaymentService.recordPayment(
      { residentId: residentIdA, invoiceId: invoiceIdB, amount: 2000, paymentMethod: "UPI" },
      { hostelId: hostelA, userId: "acct-1" }
    ),
    /Target invoice not found in this hostel/
  );

  // Overpayment rejection: payment amount > invoice balance
  await assert.rejects(
    rentPaymentService.recordPayment(
      { residentId: residentIdA, invoiceId: invoiceIdA, amount: 10000, paymentMethod: "UPI" },
      { hostelId: hostelA, userId: "acct-1" }
    ),
    /exceeds invoice outstanding balance/
  );

  // Valid partial payment
  const firstPayment = await rentPaymentService.recordPayment(
    { residentId: residentIdA, invoiceId: invoiceIdA, amount: 3500, paymentMethod: "UPI", transactionReference: "UPI-001" },
    { hostelId: hostelA, userId: "acct-1" }
  );
  check(String(firstPayment.hostelId) === hostelA, "Payment is scoped to Hostel A");
  check(firstPayment.amount === 3500, "Payment amount persisted correctly");
  check(invoiceA.paidAmount === 3500, "Invoice paid amount updated");

  // Idempotency: repeated identical submission returns existing payment without creating a duplicate
  const duplicateSubmission = await rentPaymentService.recordPayment(
    { residentId: residentIdA, invoiceId: invoiceIdA, amount: 3500, paymentMethod: "UPI", transactionReference: "UPI-001" },
    { hostelId: hostelA, userId: "acct-1" }
  );
  check(savedPayments.length === 1, "Idempotency prevents duplicate payment record");
  check(duplicateSubmission._id === firstPayment._id, "Idempotent response returns original payment ID");

  // 5. Expense Management & Tenant Isolation
  const savedExpenses = [];
  Expense.countDocuments = async () => savedExpenses.length;
  Expense.create = async (doc) => {
    const exp = {
      ...doc,
      _id: expenseIdA,
      netAmount: doc.amount,
      save: async () => {},
    };
    savedExpenses.push(exp);
    return exp;
  };

  const createdExpense = await expenseService.createExpense(
    { categoryId: new mongoose.Types.ObjectId().toString(), title: "Plumbing Pipes", amount: 1200, paymentMethod: "Cash" },
    { hostelId: hostelA, userId: "acct-1" }
  );
  check(String(createdExpense.hostelId) === hostelA, "Created expense is scoped to Hostel A");
  check(createdExpense.netAmount === 1200, "Expense net amount calculated");

  // Cross-tenant expense mutation rejection
  Expense.findOne = async (query) => {
    if (String(query._id) === expenseIdA && String(query.hostelId) === hostelA) {
      return createdExpense;
    }
    return null;
  };

  await assert.rejects(
    expenseService.updateExpenseStatus(expenseIdA, "Cancelled", { hostelId: hostelB, userId: "acct-2" }),
    /Expense not found in this hostel/
  );

  await assert.rejects(
    expenseService.softDeleteExpense(expenseIdA, { hostelId: hostelB, userId: "acct-2" }),
    /Expense not found in this hostel/
  );

  // 6. Accountant Dashboard Stats Aggregation Contract
  RentPayment.aggregate = async (pipeline) => {
    check(String(pipeline[0].$match.hostelId) === hostelA, "RentPayment aggregation is tenant scoped");
    return [{ _id: null, total: 3500 }];
  };

  Payment.find = async (query) => {
    check(String(query.hostelId) === hostelA, "Legacy payment find is tenant scoped");
    return [];
  };

  RentInvoice.aggregate = async (pipeline) => {
    check(String(pipeline[0].$match.hostelId) === hostelA, "RentInvoice aggregation is tenant scoped");
    return [{ _id: null, total: 4000 }];
  };

  Payment.aggregate = async (query) => [{ _id: null, total: 0 }];

  Expense.aggregate = async (pipeline) => {
    check(String(pipeline[0].$match.hostelId) === hostelA, "Expense aggregation is tenant scoped");
    return [{ _id: null, total: 1200 }];
  };

  BankAccount.aggregate = async (pipeline) => {
    check(String(pipeline[0].$match.hostelId) === hostelA, "BankAccount aggregation is tenant scoped");
    return [{ _id: null, total: 85000 }];
  };

  VendorInvoice.countDocuments = async (query) => {
    check(String(query.hostelId) === hostelA, "VendorInvoice count is tenant scoped");
    return 2;
  };

  let dashResponse;
  const mockReq = {
    user: { role: "Accountant", hostelId: hostelA },
    query: { role: "accountant" },
  };
  const mockRes = {
    status: (code) => {
      check(code === 200, "Dashboard returns 200 OK");
      return {
        json: (data) => {
          dashResponse = data;
          return data;
        },
      };
    },
  };

  await getStaffDashboard(mockReq, mockRes);
  check(dashResponse.success === true, "Dashboard response indicates success");
  check(dashResponse.stats.todayCollection === 3500, "Dashboard computes real confirmed collections today");
  check(dashResponse.stats.outstandingRent === 4000, "Dashboard computes real outstanding rent balance");
  check(dashResponse.stats.todayExpenses === 1200, "Dashboard computes real today expenses");
  check(dashResponse.stats.bankBalance === 85000, "Dashboard computes real active bank balance");
  check(dashResponse.stats.vendorBillsPending === 2, "Dashboard computes real pending vendor bills count");

  console.log(`PASS: Wave 2B Accountant Operations contracts (${assertions} assertions; database not connected)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
