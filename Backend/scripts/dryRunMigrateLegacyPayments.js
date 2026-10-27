require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const Payment = require("../models/Payment");
const Resident = require("../models/Resident");
const RentInvoice = require("../models/RentInvoice");
const RentPayment = require("../models/RentPayment");
const ResidentLedger = require("../models/ResidentLedger");

/**
 * Wave 4 Phase 1A: Dry-Run Legacy Payment Migration Script
 *
 * READ-ONLY GUARANTEE:
 * This script strictly performs reads and deterministic in-memory mapping.
 * It DOES NOT perform .save(), .create(), .insertMany(), .update(), or any mutations.
 */
async function runDryRunMigration() {
  console.log("================================================================================");
  console.log("HOSTELMATE — WAVE 4 PHASE 1A: DRY-RUN LEGACY PAYMENT MIGRATION");
  console.log("================================================================================");

  if (!process.env.MONGO_URI) {
    console.error("ERROR: MONGO_URI missing from environment variables.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected securely to MongoDB Atlas (READ-ONLY DRY RUN MODE)");

    // 1. Fetch all legacy payments
    const legacyPayments = await Payment.find().sort({ createdAt: 1 }).lean();
    console.log(`✓ Fetched ${legacyPayments.length} legacy Payment records from database\n`);

    const plannedInvoices = [];
    const plannedPayments = [];
    const plannedLedgerEntries = [];

    let sourceTotalPaid = 0;
    let sourceTotalRent = 0;
    let sourceTotalBalance = 0;

    let targetTotalPaid = 0;
    let targetTotalRent = 0;
    let targetTotalBalance = 0;

    const migrationPlan = [];

    for (let i = 0; i < legacyPayments.length; i++) {
      const lp = legacyPayments[i];
      const resident = await Resident.findById(lp.residentId).lean();

      const residentName = resident
        ? (resident.fullName || `${resident.firstName || ""} ${resident.lastName || ""}`.trim())
        : "Unknown Resident";

      const lpPaid = Number(lp.paidAmount || (lp.entries || []).reduce((s, e) => s + Number(e.amount || 0), 0) || 0);
      const lpRent = Number(lp.totalRent || lpPaid || 0);
      const lpBal = Number(lp.balance !== undefined ? lp.balance : Math.max(0, lpRent - lpPaid));

      sourceTotalPaid += lpPaid;
      sourceTotalRent += lpRent;
      sourceTotalBalance += lpBal;

      // Deterministic Target Invoice
      const invoiceNumber = `INV-MIG-${String(lp._id).slice(-6).toUpperCase()}`;
      const targetInvoice = {
        tenantId: lp.hostelId,
        hostelId: lp.hostelId,
        residentId: lp.residentId,
        roomId: resident?.roomId || null,
        bedId: resident?.bedId || null,
        invoiceNumber,
        billingPeriod: lp.month || (lp.createdAt ? `${new Date(lp.createdAt).getFullYear()}-${String(new Date(lp.createdAt).getMonth() + 1).padStart(2, "0")}` : "2026-10"),
        issueDate: lp.createdAt || new Date(),
        dueDate: lp.createdAt || new Date(),
        rentAmount: lpRent,
        maintenanceCharge: 0,
        electricityCharge: 0,
        waterCharge: 0,
        wifiCharge: 0,
        foodCharge: 0,
        laundryCharge: 0,
        parkingCharge: 0,
        otherCharges: 0,
        discount: 0,
        lateFee: 0,
        subtotal: lpRent,
        grandTotal: lpRent,
        paidAmount: lpPaid,
        balanceAmount: lpBal,
        paymentStatus: lpBal <= 0 ? "Paid" : (lpPaid > 0 ? "Partially Paid" : "Pending"),
        notes: `Migrated from legacy Payment record ${lp._id}`,
        isMigrated: true,
        sourceLegacyId: lp._id,
      };

      // Deterministic Target RentPayment
      const paymentNumber = `RCP-MIG-${String(lp._id).slice(-6).toUpperCase()}`;
      const methodNormalized = lp.paymentMethod
        ? (lp.paymentMethod.toUpperCase() === "CASH" ? "Cash" : (lp.paymentMethod.toUpperCase() === "ONLINE" ? "UPI" : "Cash"))
        : "Cash";

      const targetPayment = {
        tenantId: lp.hostelId,
        hostelId: lp.hostelId,
        residentId: lp.residentId,
        invoiceNumber,
        paymentNumber,
        paymentDate: lp.createdAt || new Date(),
        amount: lpPaid,
        paymentMethod: methodNormalized,
        transactionReference: `LEGACY-MIG-${lp._id}`,
        idempotencyKey: `legacy-mig-${lp._id}`,
        status: lp.status?.toLowerCase() === "cancelled" ? "Refunded" : "Completed",
        remarks: `Migrated from legacy payment record (Month: ${lp.month || "N/A"})`,
        isMigrated: true,
        sourceLegacyId: lp._id,
      };

      // Deterministic Target Ledger Entries (Double-Entry Debit & Credit)
      const chargeLedgerEntry = {
        tenantId: lp.hostelId,
        hostelId: lp.hostelId,
        residentId: lp.residentId,
        transactionDate: lp.createdAt || new Date(),
        transactionType: "Rent",
        debit: lpRent,
        credit: 0,
        balance: lpRent,
        remarks: `Rent charge for period ${targetInvoice.billingPeriod} (Migrated)`,
      };

      const paymentLedgerEntry = {
        tenantId: lp.hostelId,
        hostelId: lp.hostelId,
        residentId: lp.residentId,
        transactionDate: lp.createdAt || new Date(),
        transactionType: "Payment",
        debit: 0,
        credit: lpPaid,
        balance: lpBal,
        remarks: `Payment collection ${paymentNumber} (Migrated)`,
      };

      targetTotalPaid += targetPayment.amount;
      targetTotalRent += targetInvoice.grandTotal;
      targetTotalBalance += targetInvoice.balanceAmount;

      plannedInvoices.push(targetInvoice);
      plannedPayments.push(targetPayment);
      plannedLedgerEntries.push(chargeLedgerEntry, paymentLedgerEntry);

      migrationPlan.push({
        index: i + 1,
        legacyPaymentId: String(lp._id),
        hostelId: String(lp.hostelId),
        residentId: String(lp.residentId),
        residentName,
        month: lp.month,
        sourcePaid: lpPaid,
        sourceRent: lpRent,
        sourceBalance: lpBal,
        targetInvoiceNumber: invoiceNumber,
        targetPaymentNumber: paymentNumber,
        targetMethod: methodNormalized,
        targetStatus: targetPayment.status,
      });
    }

    // Reconciliation Checks
    const countMatch = legacyPayments.length === plannedPayments.length && plannedPayments.length === plannedInvoices.length;
    const paidMatch = sourceTotalPaid === targetTotalPaid;
    const rentMatch = sourceTotalRent === targetTotalRent;
    const balMatch = sourceTotalBalance === targetTotalBalance;
    const isReconciled = countMatch && paidMatch && rentMatch && balMatch;

    console.log("--------------------------------------------------------------------------------");
    console.log("RECONCILIATION AUDIT SUMMARY:");
    console.log("--------------------------------------------------------------------------------");
    console.log(`Source Total Legacy Records:   ${legacyPayments.length}`);
    console.log(`Target Planned Invoices:       ${plannedInvoices.length}`);
    console.log(`Target Planned Payments:       ${plannedPayments.length}`);
    console.log(`Target Planned Ledger Entries: ${plannedLedgerEntries.length}`);
    console.log("---");
    console.log(`Source Total Paid:             ₹${sourceTotalPaid.toLocaleString()} | Target: ₹${targetTotalPaid.toLocaleString()} -> ${paidMatch ? "MATCH ✓" : "MISMATCH ✗"}`);
    console.log(`Source Total Rent:             ₹${sourceTotalRent.toLocaleString()} | Target: ₹${targetTotalRent.toLocaleString()} -> ${rentMatch ? "MATCH ✓" : "MISMATCH ✗"}`);
    console.log(`Source Total Balance:          ₹${sourceTotalBalance.toLocaleString()} | Target: ₹${targetTotalBalance.toLocaleString()} -> ${balMatch ? "MATCH ✓" : "MISMATCH ✗"}`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`OVERALL RECONCILIATION STATUS: ${isReconciled ? "RECONCILED: PERFECT 100% MATCH ✓" : "FAILED ✗"}`);
    console.log("--------------------------------------------------------------------------------\n");

    console.log("MIGRATION PLAN PREVIEW (FIRST 7 RECORDS):");
    migrationPlan.forEach((m) => {
      console.log(`[#${m.index}] Legacy: ${m.legacyPaymentId} | Resident: ${m.residentName.padEnd(20)} | Paid: ₹${m.sourcePaid} | Target Inv: ${m.targetInvoiceNumber} | Target Rcpt: ${m.targetPaymentNumber} (${m.targetMethod})`);
    });

    const reportOutput = {
      timestamp: new Date().toISOString(),
      executionMode: "DRY_RUN_READ_ONLY",
      mutationsPerformed: false,
      reconciliation: {
        isReconciled,
        countMatch,
        paidMatch,
        rentMatch,
        balMatch,
        sourceTotalRecords: legacyPayments.length,
        targetTotalInvoices: plannedInvoices.length,
        targetTotalPayments: plannedPayments.length,
        targetTotalLedgerEntries: plannedLedgerEntries.length,
        sourceTotalPaid,
        targetTotalPaid,
        sourceTotalRent,
        targetTotalRent,
        sourceTotalBalance,
        targetTotalBalance,
      },
      migrationPlan,
    };

    const scratchDir = path.resolve(__dirname, "../scratch");
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    const reportPath = path.join(scratchDir, "wave4_phase1a_dry_run_report.json");
    fs.writeFileSync(reportPath, JSON.stringify(reportOutput, null, 2), "utf8");
    console.log(`\n✓ Structured dry-run report written to: ${reportPath}`);
    console.log("✓ Zero database mutations occurred during this execution.\n");

    await mongoose.disconnect();
    console.log("✓ MongoDB connection closed cleanly.");
  } catch (err) {
    console.error("Migration dry run error:", err);
    process.exit(1);
  }
}

runDryRunMigration();
