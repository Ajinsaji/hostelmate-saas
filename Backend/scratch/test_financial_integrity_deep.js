const assert = require("assert");
const mongoose = require("mongoose");

// Load models
const RentPayment = require("../models/RentPayment");
const RentInvoice = require("../models/RentInvoice");
const ResidentLedger = require("../models/ResidentLedger");
const Resident = require("../models/Resident");
const AuditLog = require("../models/AuditLog");
const FinancialPeriod = require("../models/FinancialPeriod");
const { recordPaymentSchema, reversePaymentSchema } = require("../validations/rentValidation");
const rentPaymentService = require("../services/rentPaymentService");

// Disable Mongoose buffering for isolated unit tests
mongoose.set("bufferCommands", false);
FinancialPeriod.findOne = async () => null;

function executePreSaveHook(doc) {
  const saveHooks = RentInvoice.schema.s.hooks._pres.get("save") || [];
  const customHook = saveHooks.find(h => !h.fn[Symbol.for("mongoose:built-in-middleware")] && typeof h.fn === "function")?.fn;
  if (customHook) {
    customHook.call(doc, () => {});
  }
}

async function runDeepFinancialIntegritySuite() {
  console.log("================================================================================");
  console.log("HOSTELMATE — WAVE 4 PHASE 1B: DEEP FINANCIAL INTEGRITY TEST SUITE");
  console.log("================================================================================");

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  console.log("\n1. INVOICE PRE-SAVE HOOK & REVERSAL STATUS RESET CONTRACTS");

  await test("Pre-save sets status to 'Paid' when paid in full", async () => {
    const inv = new RentInvoice({
      hostelId: new mongoose.Types.ObjectId(),
      residentId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-PRE-001",
      billingPeriod: "2026-10",
      dueDate: new Date(Date.now() + 86400000),
      rentAmount: 8000,
      paidAmount: 8000,
    });
    executePreSaveHook(inv);
    assert.strictEqual(inv.balanceAmount, 0);
    assert.strictEqual(inv.paymentStatus, "Paid");
  });

  await test("Pre-save resets status from 'Paid' to 'Pending' when paidAmount drops to 0 (future due date)", async () => {
    const inv = new RentInvoice({
      hostelId: new mongoose.Types.ObjectId(),
      residentId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-PRE-002",
      billingPeriod: "2026-10",
      dueDate: new Date(Date.now() + 86400000), // Tomorrow
      rentAmount: 8000,
      paidAmount: 0,
      paymentStatus: "Paid", // Previous status before reversal
    });
    executePreSaveHook(inv);
    assert.strictEqual(inv.balanceAmount, 8000);
    assert.strictEqual(inv.paymentStatus, "Pending");
  });

  await test("Pre-save resets status from 'Paid' to 'Overdue' when paidAmount drops to 0 (past due date)", async () => {
    const inv = new RentInvoice({
      hostelId: new mongoose.Types.ObjectId(),
      residentId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-PRE-003",
      billingPeriod: "2026-09",
      dueDate: new Date(Date.now() - 86400000), // Yesterday
      rentAmount: 8000,
      paidAmount: 0,
      paymentStatus: "Paid",
    });
    executePreSaveHook(inv);
    assert.strictEqual(inv.balanceAmount, 8000);
    assert.strictEqual(inv.paymentStatus, "Overdue");
  });

  await test("Pre-save resets status from 'Paid' to 'Partially Paid' when partial reversal occurs", async () => {
    const inv = new RentInvoice({
      hostelId: new mongoose.Types.ObjectId(),
      residentId: new mongoose.Types.ObjectId(),
      invoiceNumber: "INV-PRE-004",
      billingPeriod: "2026-10",
      dueDate: new Date(Date.now() + 86400000),
      rentAmount: 8000,
      paidAmount: 4000,
      paymentStatus: "Paid",
    });
    executePreSaveHook(inv);
    assert.strictEqual(inv.balanceAmount, 4000);
    assert.strictEqual(inv.paymentStatus, "Partially Paid");
  });

  console.log("\n2. DURABLE IDEMPOTENCY & CONCURRENCY REPEAT CONTRACTS");

  const mockHostelId = new mongoose.Types.ObjectId().toString();
  const mockResidentId = new mongoose.Types.ObjectId().toString();
  const mockInvoiceId = new mongoose.Types.ObjectId().toString();

  const inMemoryPayments = new Map();
  const inMemoryInvoices = new Map();
  const inMemoryLedgers = [];
  const inMemoryAudits = [];

  // Setup initial mock invoice
  const mockInvoice = {
    _id: mockInvoiceId,
    hostelId: mockHostelId,
    residentId: mockResidentId,
    invoiceNumber: "INV-SIM-001",
    billingPeriod: "2026-10",
    dueDate: new Date(Date.now() + 86400000),
    rentAmount: 8000,
    grandTotal: 8000,
    paidAmount: 0,
    balanceAmount: 8000,
    paymentStatus: "Pending",
    isDeleted: false,
    save: async function() {
      this.balanceAmount = Math.max(0, this.grandTotal - this.paidAmount);
      this.paymentStatus = this.paidAmount >= this.grandTotal ? "Paid" : (this.paidAmount > 0 ? "Partially Paid" : "Pending");
      inMemoryInvoices.set(String(this._id), { ...this });
      return this;
    }
  };
  inMemoryInvoices.set(String(mockInvoiceId), mockInvoice);

  // Mock Resident.findOne
  Resident.findOne = async () => ({
    _id: mockResidentId,
    hostelId: mockHostelId,
    fullName: "Test Resident",
    name: "Test Resident",
    isDeleted: false,
  });

  // Mock RentInvoice.findOne
  RentInvoice.findOne = (query) => {
    const doc = inMemoryInvoices.get(String(query._id));
    const chainable = {
      session: () => chainable,
      then: (resolve) => resolve(doc ? doc : null),
    };
    return chainable;
  };

  // Mock RentPayment count & find & create
  RentPayment.countDocuments = async () => inMemoryPayments.size;
  RentPayment.findOne = (query) => {
    let match = null;
    for (const p of inMemoryPayments.values()) {
      if (query._id && String(p._id) === String(query._id) && String(p.hostelId) === String(query.hostelId)) {
        match = p;
      }
      if (query.idempotencyKey && p.idempotencyKey === query.idempotencyKey && String(p.hostelId) === String(query.hostelId)) {
        match = p;
      }
    }
    const chainable = {
      session: () => chainable,
      then: (resolve) => resolve(match ? match : null),
    };
    return chainable;
  };

  RentPayment.create = async (docOrDocs) => {
    const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
    const created = docs.map(d => {
      // Simulate unique idempotencyKey index constraint
      if (d.idempotencyKey) {
        for (const existing of inMemoryPayments.values()) {
          if (String(existing.hostelId) === String(d.hostelId) && existing.idempotencyKey === d.idempotencyKey) {
            const err = new Error("E11000 duplicate key error collection: rentpayments index: hostelId_1_idempotencyKey_1 dup key");
            err.code = 11000;
            throw err;
          }
        }
      }
      const newDoc = {
        ...d,
        _id: d._id || new mongoose.Types.ObjectId().toString(),
        createdAt: new Date(),
        save: async function() {
          inMemoryPayments.set(String(this._id), this);
          return this;
        }
      };
      inMemoryPayments.set(String(newDoc._id), newDoc);
      return newDoc;
    });
    return Array.isArray(docOrDocs) ? created : created[0];
  };

  // Mock ResidentLedger findOne & create for ledgerService
  ResidentLedger.findOne = () => {
    const last = inMemoryLedgers.length > 0 ? inMemoryLedgers[inMemoryLedgers.length - 1] : null;
    const chainable = {
      sort: () => chainable,
      session: () => chainable,
      then: (resolve) => resolve(last ? { ...last } : null),
    };
    return chainable;
  };

  ResidentLedger.create = async (docOrDocs) => {
    const docs = Array.isArray(docOrDocs) ? docOrDocs : [docOrDocs];
    docs.forEach(d => inMemoryLedgers.push(d));
    return Array.isArray(docOrDocs) ? docs : docs[0];
  };

  // Mock AuditLog.create
  AuditLog.create = async (entry) => {
    inMemoryAudits.push(entry);
    return entry;
  };

  let p1;
  await test("First payment request with idempotencyKey creates payment and updates invoice", async () => {
    p1 = await rentPaymentService.recordPayment({
      hostelId: mockHostelId,
      residentId: mockResidentId,
      invoiceId: mockInvoiceId,
      amount: 8000,
      paymentMethod: "UPI",
      idempotencyKey: "test-idem-unique-001",
    }, { hostelId: mockHostelId, userId: "owner-1" });

    assert.strictEqual(p1.status, "Completed");
    assert.strictEqual(p1.amount, 8000);
    assert.strictEqual(inMemoryPayments.size, 1);
    assert.strictEqual(inMemoryLedgers.length, 1);
    assert.strictEqual(inMemoryLedgers[0].credit, 8000);
    assert.strictEqual(mockInvoice.paidAmount, 8000);
    assert.strictEqual(mockInvoice.balanceAmount, 0);
    assert.strictEqual(mockInvoice.paymentStatus, "Paid");
  });

  await test("Repeated identical request with same idempotencyKey returns existing record without duplicate write", async () => {
    const duplicate = await rentPaymentService.recordPayment({
      hostelId: mockHostelId,
      residentId: mockResidentId,
      invoiceId: mockInvoiceId,
      amount: 8000,
      paymentMethod: "UPI",
      idempotencyKey: "test-idem-unique-001",
    }, { hostelId: mockHostelId, userId: "owner-1" });

    assert.strictEqual(duplicate.idempotencyKey, "test-idem-unique-001");
    assert.strictEqual(String(duplicate._id), String(p1._id));
    assert.strictEqual(inMemoryPayments.size, 1, "Payments count must remain 1");
    assert.strictEqual(inMemoryLedgers.length, 1, "Ledger credit entries must remain 1");
    assert.strictEqual(mockInvoice.paidAmount, 8000, "Invoice paidAmount must not be incremented twice");
  });

  console.log("\n3. PAYMENT REVERSAL TRANSACTION INTEGRITY & DUPLICATE PROTECTION");

  await test("Reversing payment restores invoice paidAmount to 0 and records offsetting ledger DEBIT", async () => {
    const initialLedgerCount = inMemoryLedgers.length;
    const initialAuditCount = inMemoryAudits.length;

    const reversed = await rentPaymentService.reversePayment(
      p1._id,
      { reason: "Customer bank chargeback request" },
      { hostelId: mockHostelId, userId: "owner-1" }
    );

    assert.strictEqual(reversed.status, "Reversed");
    assert.strictEqual(reversed.reversalReason, "Customer bank chargeback request");

    // Check invoice restoration
    const restoredInvoice = inMemoryInvoices.get(String(mockInvoiceId));
    assert.strictEqual(restoredInvoice.paidAmount, 0, "Invoice paidAmount must be restored to 0");
    assert.strictEqual(restoredInvoice.balanceAmount, 8000, "Invoice balanceAmount must be restored to 8000");
    assert.strictEqual(restoredInvoice.paymentStatus, "Pending", "Invoice status must be reset to Pending");

    // Check offsetting ledger DEBIT
    assert.strictEqual(inMemoryLedgers.length, initialLedgerCount + 1);
    const reversalLedger = inMemoryLedgers[inMemoryLedgers.length - 1];
    assert.strictEqual(reversalLedger.debit, 8000, "Ledger entry must have DEBIT 8000");
    assert.strictEqual(reversalLedger.credit, 0);
    assert.strictEqual(reversalLedger.transactionType, "Adjustment");

    // Check AuditLog creation
    assert.strictEqual(inMemoryAudits.length, initialAuditCount + 1);
  });

  await test("Second reversal attempt on already reversed payment is blocked", async () => {
    let errorThrown = null;
    try {
      await rentPaymentService.reversePayment(
        p1._id,
        { reason: "Attempting duplicate reversal" },
        { hostelId: mockHostelId, userId: "owner-1" }
      );
    } catch (err) {
      errorThrown = err;
    }
    assert.ok(errorThrown, "Must throw error");
    assert.strictEqual(errorThrown.message, "Payment has already been reversed");
  });

  await test("Reversal attempt with wrong tenant hostelId is rejected (Tenant Isolation)", async () => {
    const alienHostelId = new mongoose.Types.ObjectId().toString();
    let errorThrown = null;
    try {
      await rentPaymentService.reversePayment(
        p1._id,
        { reason: "Cross tenant reversal" },
        { hostelId: alienHostelId, userId: "owner-1" }
      );
    } catch (err) {
      errorThrown = err;
    }
    assert.ok(errorThrown, "Must reject cross-tenant reversal");
    assert.strictEqual(errorThrown.message, "Payment record not found in active hostel");
  });

  await test("Reversal attempt with missing/short reason is rejected without modifying records", async () => {
    let errorThrown = null;
    try {
      await rentPaymentService.reversePayment(
        p1._id,
        { reason: "no" },
        { hostelId: mockHostelId, userId: "owner-1" }
      );
    } catch (err) {
      errorThrown = err;
    }
    assert.ok(errorThrown, "Must reject reason < 3 chars");
    assert.strictEqual(errorThrown.message, "A valid reversal reason of at least 3 characters is required");
  });

  console.log("\n4. FAIL-CLOSED TRANSACTION SAFETY & CONCURRENCY CONTRACTS");

  await test("In production environment, un-established connection fails closed before executing writes", async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";
    let errorThrown = null;
    try {
      await rentPaymentService.recordPayment({
        hostelId: mockHostelId,
        residentId: mockResidentId,
        invoiceId: mockInvoiceId,
        amount: 1000,
        paymentMethod: "UPI",
        idempotencyKey: "prod-fail-closed-key",
      }, { hostelId: mockHostelId, userId: "owner-1" });
    } catch (err) {
      errorThrown = err;
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
    assert.ok(errorThrown, "Must fail closed in production without connection");
    assert.strictEqual(errorThrown.message, "Financial transaction aborted: MongoDB connection is not active.");
  });

  await test("Concurrent requests with identical idempotencyKey resolve to the same payment without duplicate writes", async () => {
    const key = "concurrent-idem-key-8888";
    const initialPaymentsCount = inMemoryPayments.size;
    const initialLedgersCount = inMemoryLedgers.length;

    // Execute 3 concurrent requests simultaneously with Promise.all
    const results = await Promise.all([
      rentPaymentService.recordPayment({
        hostelId: mockHostelId,
        residentId: mockResidentId,
        amount: 2000,
        paymentMethod: "UPI",
        idempotencyKey: key,
      }, { hostelId: mockHostelId, userId: "owner-1" }),
      rentPaymentService.recordPayment({
        hostelId: mockHostelId,
        residentId: mockResidentId,
        amount: 2000,
        paymentMethod: "UPI",
        idempotencyKey: key,
      }, { hostelId: mockHostelId, userId: "owner-1" }),
      rentPaymentService.recordPayment({
        hostelId: mockHostelId,
        residentId: mockResidentId,
        amount: 2000,
        paymentMethod: "UPI",
        idempotencyKey: key,
      }, { hostelId: mockHostelId, userId: "owner-1" }),
    ]);

    // All 3 callers must receive the exact same payment object
    assert.strictEqual(results.length, 3);
    assert.strictEqual(String(results[0]._id), String(results[1]._id));
    assert.strictEqual(String(results[1]._id), String(results[2]._id));

    // Must have created exactly 1 payment and 1 ledger entry, zero duplicate mutations
    assert.strictEqual(inMemoryPayments.size, initialPaymentsCount + 1, "Only 1 payment record created");
    assert.strictEqual(inMemoryLedgers.length, initialLedgersCount + 1, "Only 1 ledger credit created");
  });

  console.log("================================================================================");
  console.log(`FINANCIAL INTEGRITY SUITE RESULT: ${passed} passed, ${failed} failed`);
  console.log("================================================================================");

  if (failed > 0) process.exit(1);
}

runDeepFinancialIntegritySuite();
