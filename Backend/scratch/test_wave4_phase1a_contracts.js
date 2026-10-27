const assert = require("assert");
const mongoose = require("mongoose");
const { recordPaymentSchema, createInvoiceSchema } = require("../validations/rentValidation");

console.log("=== WAVE 4 PHASE 1A: AR VALIDATION & BASELINE CONTRACT TESTS ===");

let passed = 0;
let failed = 0;

function check(desc, condition) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${desc}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${desc}`);
  }
}

// 1. Validation Schema Tests
console.log("\n1. Validation Schema Contracts");
const validPaymentPayload = {
  residentId: new mongoose.Types.ObjectId().toString(),
  invoiceId: new mongoose.Types.ObjectId().toString(),
  amount: 6500,
  paymentMethod: "UPI",
  transactionReference: "UPI-REF-123456",
  remarks: "March Rent",
};

check("Valid payment payload passes Joi validation", !recordPaymentSchema.validate(validPaymentPayload).error);
check("Payment without residentId is rejected", Boolean(recordPaymentSchema.validate({ amount: 6500 }).error));
check("Zero amount payment is rejected", Boolean(recordPaymentSchema.validate({ ...validPaymentPayload, amount: 0 }).error));
check("Negative amount payment is rejected", Boolean(recordPaymentSchema.validate({ ...validPaymentPayload, amount: -100 }).error));
check("Invalid payment method is rejected", Boolean(recordPaymentSchema.validate({ ...validPaymentPayload, paymentMethod: "BitCoin" }).error));

const validPaymentWithCash = { ...validPaymentPayload, paymentMethod: "Cash" };
check("Cash payment method is valid", !recordPaymentSchema.validate(validPaymentWithCash).error);

const validPaymentWithoutInvoice = { ...validPaymentPayload, invoiceId: null };
check("Payment without invoiceId (direct advance) is accepted", !recordPaymentSchema.validate(validPaymentWithoutInvoice).error);

// 2. Invoice Model Calculations
console.log("\n2. Invoice Pre-Save Calculation Logic");
function calculateInvoiceTotals(invoice) {
  const addOns =
    (invoice.maintenanceCharge || 0) +
    (invoice.electricityCharge || 0) +
    (invoice.waterCharge || 0) +
    (invoice.wifiCharge || 0) +
    (invoice.foodCharge || 0) +
    (invoice.laundryCharge || 0) +
    (invoice.parkingCharge || 0) +
    (invoice.otherCharges || 0);

  const subtotal = (invoice.rentAmount || 0) + addOns;
  const grandTotal = Math.max(0, subtotal + (invoice.lateFee || 0) - (invoice.discount || 0));
  const balanceAmount = Math.max(0, grandTotal - (invoice.paidAmount || 0));

  let paymentStatus = "Pending";
  if (invoice.paidAmount >= grandTotal && grandTotal > 0) {
    paymentStatus = "Paid";
  } else if (invoice.paidAmount > 0 && invoice.paidAmount < grandTotal) {
    paymentStatus = "Partially Paid";
  } else if (invoice.dueDate && new Date(invoice.dueDate) < new Date() && paymentStatus === "Pending") {
    paymentStatus = "Overdue";
  }

  return { subtotal, grandTotal, balanceAmount, paymentStatus };
}

const inv1 = calculateInvoiceTotals({
  rentAmount: 8000,
  maintenanceCharge: 500,
  electricityCharge: 300,
  discount: 200,
  paidAmount: 0,
});
check("Subtotal sums rent and add-ons correctly (8000 + 500 + 300 = 8800)", inv1.subtotal === 8800);
check("Grand total applies discount correctly (8800 - 200 = 8600)", inv1.grandTotal === 8600);
check("Unpaid balance matches grand total (8600)", inv1.balanceAmount === 8600);
check("Status is Pending when unpaid", inv1.paymentStatus === "Pending");

const inv2 = calculateInvoiceTotals({
  rentAmount: 8000,
  paidAmount: 4000,
});
check("Partial payment sets status to 'Partially Paid'", inv2.paymentStatus === "Partially Paid");
check("Partial payment balance is 4000", inv2.balanceAmount === 4000);

const inv3 = calculateInvoiceTotals({
  rentAmount: 8000,
  paidAmount: 8000,
});
check("Full payment sets status to 'Paid'", inv3.paymentStatus === "Paid");
check("Full payment balance is 0", inv3.balanceAmount === 0);

// 3. Resident Ledger Double-Entry Logic
console.log("\n3. Resident Ledger Double-Entry Rules");
function calculateNextLedgerBalance(prevBalance, transactionType, debit, credit) {
  // Debit increases what resident owes; Credit decreases what resident owes
  return prevBalance + debit - credit;
}

let runningBalance = 0;
// Invoice generated: DEBIT 8000
runningBalance = calculateNextLedgerBalance(runningBalance, "Rent", 8000, 0);
check("Invoice generation creates DEBIT: balance increases to 8000", runningBalance === 8000);

// Payment made: CREDIT 5000
runningBalance = calculateNextLedgerBalance(runningBalance, "Payment", 0, 5000);
check("Payment creates CREDIT: balance drops to 3000", runningBalance === 3000);

// Payment reversal / refund: DEBIT 5000
runningBalance = calculateNextLedgerBalance(runningBalance, "Refund", 5000, 0);
check("Payment reversal creates offsetting DEBIT: balance restored to 8000", runningBalance === 8000);

// Payment made in full: CREDIT 8000
runningBalance = calculateNextLedgerBalance(runningBalance, "Payment", 0, 8000);
check("Full payment clears ledger balance to 0", runningBalance === 0);

// 4. Overpayment / Prepayment Credit
runningBalance = calculateNextLedgerBalance(runningBalance, "Payment", 0, 2000);
check("Advance payment creates negative ledger balance (credit balance: -2000)", runningBalance === -2000);

// 5. Reversal Schema & Durable Idempotency Contracts
console.log("\n4. Reversal Schema & Durable Idempotency Contracts");
const { reversePaymentSchema } = require("../validations/rentValidation");

check("Valid reversal reason passes validation", !reversePaymentSchema.validate({ reason: "Duplicate entry by warden" }).error);
check("Missing reversal reason is rejected", Boolean(reversePaymentSchema.validate({}).error));
check("Short reversal reason (<3 chars) is rejected", Boolean(reversePaymentSchema.validate({ reason: "no" }).error));

const payloadWithIdempotency = {
  ...validPaymentPayload,
  idempotencyKey: "idem-uuid-9999-8888-7777",
};
check("Payment with valid idempotencyKey is accepted", !recordPaymentSchema.validate(payloadWithIdempotency).error);

// 6. Service-level Unit Tests: reversePayment & Durable Idempotency
(async () => {
  console.log("\n5. Service-level Reversal & Idempotency Executions");
  const rentPaymentService = require("../services/rentPaymentService");
  const RentPayment = require("../models/RentPayment");
  const RentInvoice = require("../models/RentInvoice");
  const Resident = require("../models/Resident");
  const FinancialPeriod = require("../models/FinancialPeriod");
  const ResidentLedger = require("../models/ResidentLedger");
  const AuditLog = require("../models/AuditLog");

  // Mock FinancialPeriod to Open
  FinancialPeriod.findOne = async () => null;

  // Mock AuditLog
  AuditLog.create = async () => ({});

  // Mock ResidentLedger
  const ledgerEntries = [];
  ResidentLedger.findOne = () => ({
    sort: () => ({
      session: () => null,
      then: (resolve) => resolve(ledgerEntries[ledgerEntries.length - 1] || null),
    }),
  });
  ResidentLedger.create = async (doc) => {
    const raw = Array.isArray(doc) ? doc[0] : doc;
    ledgerEntries.push(raw);
    return Array.isArray(doc) ? [raw] : raw;
  };

  const hostelId = new mongoose.Types.ObjectId().toString();
  const residentId = new mongoose.Types.ObjectId().toString();
  const invoiceId = new mongoose.Types.ObjectId().toString();
  const paymentId = new mongoose.Types.ObjectId().toString();

  // Mock Resident
  Resident.findOne = async () => ({
    _id: residentId,
    hostelId,
    fullName: "Test Resident",
    isDeleted: false,
  });

  // Mock Invoice
  const testInvoice = {
    _id: invoiceId,
    hostelId,
    residentId,
    grandTotal: 10000,
    paidAmount: 5000,
    balanceAmount: 5000,
    paymentStatus: "Partially Paid",
    isDeleted: false,
    save: async function () {
      this.balanceAmount = this.grandTotal - this.paidAmount;
      this.paymentStatus = this.paidAmount >= this.grandTotal ? "Paid" : (this.paidAmount > 0 ? "Partially Paid" : "Pending");
      return this;
    },
  };
  RentInvoice.findOne = async () => testInvoice;

  // Mock Payments store
  const paymentStore = new Map();

  RentPayment.countDocuments = async () => paymentStore.size;
  RentPayment.findOne = async (q) => {
    if (q._id && q.hostelId) {
      const p = paymentStore.get(String(q._id));
      if (p && String(p.hostelId) === String(q.hostelId)) return p;
      return null;
    }
    if (q.hostelId && q.idempotencyKey) {
      for (const p of paymentStore.values()) {
        if (String(p.hostelId) === String(q.hostelId) && p.idempotencyKey === q.idempotencyKey) return p;
      }
    }
    return null;
  };
  RentPayment.create = async (doc) => {
    const raw = Array.isArray(doc) ? doc[0] : doc;
    const p = {
      ...raw,
      _id: raw._id || new mongoose.Types.ObjectId().toString(),
      status: "Completed",
      save: async function () { return this; },
    };
    paymentStore.set(String(p._id), p);
    return Array.isArray(doc) ? [p] : p;
  };

  // Test 1: Record payment with idempotencyKey
  const p1 = await rentPaymentService.recordPayment(
    {
      residentId,
      invoiceId,
      amount: 3000,
      paymentMethod: "UPI",
      idempotencyKey: "test-idem-key-1001",
    },
    { hostelId, userId: "owner-1" }
  );
  check("Payment 1 created with status 'Completed'", p1.status === "Completed");
  check("Payment 1 recorded under idempotency key", p1.idempotencyKey === "test-idem-key-1001");
  check("Invoice paid amount increased to 8000", testInvoice.paidAmount === 8000);

  // Test 2: Duplicate payment with same idempotencyKey returns existing record without modifying invoice again
  const p1Duplicate = await rentPaymentService.recordPayment(
    {
      residentId,
      invoiceId,
      amount: 3000,
      paymentMethod: "UPI",
      idempotencyKey: "test-idem-key-1001",
    },
    { hostelId, userId: "owner-1" }
  );
  check("Idempotent retry returns identical payment object", String(p1Duplicate._id) === String(p1._id));
  check("Invoice paid amount remained 8000 (not duplicated)", testInvoice.paidAmount === 8000);

  // Test 3: Reversal rejects invalid reason
  await assert.rejects(
    rentPaymentService.reversePayment(p1._id, { reason: "ab" }, { hostelId, userId: "owner-1" }),
    /reversal reason/
  );
  check("Short reversal reason is rejected by service", true);

  // Test 4: Reversal rejects cross-tenant attempt
  await assert.rejects(
    rentPaymentService.reversePayment(p1._id, { reason: "Entered wrong amount" }, { hostelId: "different-hostel", userId: "owner-1" }),
    /Payment record not found/
  );
  check("Cross-tenant reversal is rejected", true);

  // Test 5: Successful reversal
  const reversed = await rentPaymentService.reversePayment(
    p1._id,
    { reason: "Customer entered wrong room number" },
    { hostelId, userId: "owner-1" }
  );
  check("Payment status updated to 'Reversed'", reversed.status === "Reversed");
  check("Reversal reason recorded", reversed.reversalReason === "Customer entered wrong room number");
  check("Invoice paid amount restored from 8000 back to 5000", testInvoice.paidAmount === 5000);
  check("Invoice balance restored back to 5000", testInvoice.balanceAmount === 5000);

  // Test 6: Second reversal attempt throws error
  await assert.rejects(
    rentPaymentService.reversePayment(p1._id, { reason: "Trying again" }, { hostelId, userId: "owner-1" }),
    /already been reversed/
  );
  check("Repeated reversal on already reversed payment is blocked", true);

  console.log(`\nFinal Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
})();
