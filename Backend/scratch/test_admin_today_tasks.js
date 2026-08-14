"use strict";

/**
 * 🟢 HOSTELMATE ENTERPRISE — PHASE 8 ADMIN TODAY'S TASKS VERIFICATION SUITE
 *
 * Verifies:
 * 1. Admin receives pending manual WhatsApp tasks.
 * 2. Admin receives failed automatic WhatsApp tasks.
 * 3. Successful automatic messages are not pending.
 * 4. Manual opened messages are no longer pending_manual.
 * 5. Manual opened does not become sent.
 * 6. Retry works for failed automatic messages.
 * 7. Retry limit is respected (max 3 attempts).
 * 8. Today's Tasks count is dynamic.
 * 9. Owner can only see allowed owner tasks.
 * 10. Owner cannot see Admin-only tasks.
 * 11. Cross-hostel isolation works.
 * 12. Admin can view task detail.
 * 13. Admin can open WhatsApp for manual task.
 * 14. Admin can retry failed task.
 * 15. No JWT in logs.
 * 16. No Meta token in logs.
 * 17. No password in logs.
 * 18. No hardcoded task counts.
 */

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Communication = require("../models/Communication");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Owner = require("../models/Owner");
const SystemSetting = require("../models/SystemSetting");

const {
  getPendingCommunicationTasks,
  logManualWhatsAppClick,
  retryCommunication,
  getCommunicationDetail,
} = require("../controllers/communicationController");

const { dispatchWhatsAppMessage } = require("../services/whatsappService");

async function runAdminTodayTasksSuite() {
  console.log("==================================================");
  console.log("🟢 HOSTELMATE — ADMIN TODAY'S TASKS VERIFICATION SUITE");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  const testSuffix = Date.now();
  const loggedMessages = [];
  const origLog = console.log;
  const origWarn = console.warn;
  const origError = console.error;

  const captureLog = (...args) => {
    loggedMessages.push(args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
    origLog(...args);
  };

  console.log = captureLog;
  console.warn = captureLog;
  console.error = captureLog;

  try {
    // 1. Create Test Hostels & Owners
    const hostelA = await Hostel.create({
      hostelName: `TASKS_HOSTEL_A_${testSuffix}`,
      address: "123 Admin Lane, Bangalore, KA 560001",
      whatsappConfig: { automationEnabled: false },
    });

    const hostelB = await Hostel.create({
      hostelName: `TASKS_HOSTEL_B_${testSuffix}`,
      address: "456 Owner Rd, Hyderabad, TS 500001",
      whatsappConfig: { automationEnabled: false },
    });

    const phoneA = `9${String(testSuffix).slice(-9)}`;
    const phoneB = `8${String(testSuffix).slice(-9)}`;
    const phoneResA = `7${String(testSuffix).slice(-9)}`;
    const phoneResB = `6${String(testSuffix).slice(-9)}`;

    const ownerA = await Owner.create({
      ownerName: `Owner A ${testSuffix}`,
      email: `ownerA_${testSuffix}@example.com`,
      phone: phoneA,
      password: "HashedPassword123!",
      hostelId: hostelA._id,
    });

    const ownerB = await Owner.create({
      ownerName: `Owner B ${testSuffix}`,
      email: `ownerB_${testSuffix}@example.com`,
      phone: phoneB,
      password: "HashedPassword123!",
      hostelId: hostelB._id,
    });

    const residentA = await Resident.create({
      tenantId: hostelA._id,
      hostelId: hostelA._id,
      firstName: "Resident",
      lastName: "Alpha",
      fullName: "Resident Alpha",
      admissionNumber: `ADM_A_${testSuffix}`,
      phone: phoneResA,
      roomNumber: "101",
      bedNumber: "A",
      status: "active",
    });

    const residentB = await Resident.create({
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      firstName: "Resident",
      lastName: "Beta",
      fullName: "Resident Beta",
      admissionNumber: `ADM_B_${testSuffix}`,
      phone: phoneResB,
      roomNumber: "202",
      bedNumber: "B",
      status: "active",
    });

    console.log(`\nCreated Hostels A (${hostelA._id}) and B (${hostelB._id})`);

    // Helper for mock response
    function createMockRes() {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          this.body = data;
          return this;
        },
      };
      return res;
    }

    // ----------------------------------------------------
    // Create diverse tasks:
    // Task 1: Admin Owner Activation pending_manual
    // Task 2: Hostel A Resident Rent Reminder pending_manual
    // Task 3: Hostel A Resident Payment Received pending_manual
    // Task 4: Hostel A Failed automatic delivery
    // Task 5: Hostel B Resident Rent Reminder pending_manual
    // Task 6: Successful automatic message (status = "sent")
    // ----------------------------------------------------
    const taskAdminOwner = await Communication.create({
      hostelId: hostelA._id,
      ownerId: ownerA._id,
      type: "whatsapp",
      recipientType: "Owner",
      recipient: ownerA.phone,
      recipientName: ownerA.ownerName,
      templateCode: "OWNER_ACCOUNT_ACTIVATED",
      businessEvent: "OWNER_ACCOUNT_ACTIVATED",
      message: `Welcome ${ownerA.ownerName}! Your temporary password is TempPass_Secret_999.`,
      mode: "manual_wame",
      status: "pending_manual",
      metadata: {
        variables: {
          tempPassword: "TempPass_Secret_999",
          ownerName: ownerA.ownerName,
        },
      },
    });

    const taskHostelARent = await Communication.create({
      hostelId: hostelA._id,
      residentId: residentA._id,
      type: "whatsapp",
      recipientType: "Resident",
      recipient: residentA.phone,
      recipientName: `${residentA.firstName} ${residentA.lastName}`,
      templateCode: "RENT_REMINDER",
      businessEvent: "RENT_REMINDER",
      message: "Your rent of Rs 6000 is due.",
      mode: "manual_wame",
      status: "pending_manual",
      waMeUrl: "https://wa.me/919876500003?text=Rent%20Due",
    });

    const taskHostelAPayment = await Communication.create({
      hostelId: hostelA._id,
      residentId: residentA._id,
      type: "whatsapp",
      recipientType: "Resident",
      recipient: residentA.phone,
      recipientName: `${residentA.firstName} ${residentA.lastName}`,
      templateCode: "PAYMENT_RECEIVED",
      businessEvent: "PAYMENT_RECEIVED",
      message: "Payment of Rs 6000 confirmed.",
      mode: "manual_wame",
      status: "pending_manual",
      waMeUrl: "https://wa.me/919876500003?text=Payment%20Received",
    });

    const taskHostelAFailed = await Communication.create({
      hostelId: hostelA._id,
      residentId: residentA._id,
      type: "whatsapp",
      recipientType: "Resident",
      recipient: residentA.phone,
      recipientName: `${residentA.firstName} ${residentA.lastName}`,
      templateCode: "RENT_REMINDER",
      businessEvent: "RENT_REMINDER",
      message: "Rent due automatic dispatch failed.",
      mode: "meta_api",
      status: "failed",
      attemptCount: 1,
      failureReason: "Meta API 502 Rate Limit Reached",
    });

    const taskHostelBRent = await Communication.create({
      hostelId: hostelB._id,
      residentId: residentB._id,
      type: "whatsapp",
      recipientType: "Resident",
      recipient: residentB.phone,
      recipientName: `${residentB.firstName} ${residentB.lastName}`,
      templateCode: "RENT_REMINDER",
      businessEvent: "RENT_REMINDER",
      message: "Hostel B Rent reminder",
      mode: "manual_wame",
      status: "pending_manual",
      waMeUrl: "https://wa.me/919876500004?text=Rent%20Due%20B",
    });

    const taskSentMsg = await Communication.create({
      hostelId: hostelA._id,
      residentId: residentA._id,
      type: "whatsapp",
      recipientType: "Resident",
      recipient: residentA.phone,
      recipientName: `${residentA.firstName} ${residentA.lastName}`,
      templateCode: "ADMISSION_APPROVED",
      businessEvent: "ADMISSION_APPROVED",
      message: "Welcome to Hostel A",
      mode: "meta_api",
      status: "sent",
    });

    // ----------------------------------------------------
    // TEST 1, 2, 3, 8 & 18: Admin Pending Tasks Query & Live Dynamic Counts
    // ----------------------------------------------------
    console.log("\n[TEST 1, 2, 3, 8 & 18] Verifying Admin Pending Tasks & Dynamic Categorization...");
    const mockResAdmin = createMockRes();
    await getPendingCommunicationTasks({ user: { role: "super_admin" } }, mockResAdmin);

    const adminTasks = mockResAdmin.body?.tasks || [];
    const adminTotalCount = mockResAdmin.body?.totalCount;
    const adminCategories = mockResAdmin.body?.categories;

    // Check sent message is NOT in pending queue
    const hasSent = adminTasks.some((t) => t._id.toString() === taskSentMsg._id.toString());
    if (hasSent) {
      throw new Error("TEST 3 FAILED: Successful automatic message ('sent') must NOT appear in pending tasks queue!");
    }

    if (
      adminTotalCount >= 5 &&
      adminCategories.rentRemindersCount >= 3 && // 2 pending_manual + 1 failed
      adminCategories.ownerActivationsCount >= 1 &&
      adminCategories.paymentConfirmationsCount >= 1 &&
      adminCategories.failedDeliveriesCount >= 1
    ) {
      console.log(`✓ PASS [1, 2, 3, 8 & 18] Admin received all ${adminTotalCount} pending tasks with dynamic categorized counts:`, adminCategories);
    } else {
      throw new Error("TEST 1/2/8/18 FAILED: Admin pending tasks or dynamic categories mismatch!");
    }

    // ----------------------------------------------------
    // TEST 9, 10 & 11: Owner Role-Aware Filtering & Tenant Isolation
    // ----------------------------------------------------
    console.log("\n[TEST 9, 10 & 11] Verifying Owner Role-Aware Filtering & Cross-Hostel Isolation...");
    const mockResOwnerA = createMockRes();
    await getPendingCommunicationTasks({ user: { role: "owner", hostelId: hostelA._id } }, mockResOwnerA);

    const ownerATasks = mockResOwnerA.body?.tasks || [];
    const hasAdminOwnerTask = ownerATasks.some((t) => t.recipientType === "Owner" || t.templateCode === "OWNER_ACCOUNT_ACTIVATED");
    const hasHostelBTask = ownerATasks.some((t) => t.hostelId?._id?.toString() === hostelB._id.toString() || t.recipient === residentB.phone);

    if (hasAdminOwnerTask) {
      throw new Error("TEST 10 FAILED: Owner was able to see Admin-only owner onboarding task!");
    }
    if (hasHostelBTask) {
      throw new Error("TEST 11 FAILED: Owner A was able to see Owner B's hostel tasks!");
    }

    console.log(`✓ PASS [9, 10 & 11] Owner A received only ${ownerATasks.length} hostel-specific tasks with zero Admin or Hostel B leakage.`);

    // ----------------------------------------------------
    // TEST 4, 5 & 13: Manual WhatsApp Click Workflow (pending_manual -> manual_opened, NEVER sent)
    // ----------------------------------------------------
    console.log("\n[TEST 4, 5 & 13] Verifying Manual WhatsApp Click Workflow...");
    const mockResManualLog = createMockRes();
    await logManualWhatsAppClick({ params: { id: taskHostelARent._id }, body: { communicationId: taskHostelARent._id }, user: { role: "super_admin" } }, mockResManualLog);

    const updatedManualTask = await Communication.findById(taskHostelARent._id);
    if (updatedManualTask.status === "manual_opened" && updatedManualTask.openedAt) {
      console.log("✓ PASS [4, 5 & 13] Status successfully transitioned to 'manual_opened' and recorded timestamp. Never falsely marked as 'sent'!");
    } else {
      throw new Error(`TEST 4/5/13 FAILED: Expected status 'manual_opened', got '${updatedManualTask.status}'`);
    }

    // Verify it is no longer in pending_manual queue
    const mockResAdminAfterOpen = createMockRes();
    await getPendingCommunicationTasks({ user: { role: "super_admin" } }, mockResAdminAfterOpen);
    const stillInQueue = mockResAdminAfterOpen.body?.tasks?.some((t) => t._id.toString() === taskHostelARent._id.toString());
    if (!stillInQueue) {
      console.log("✓ PASS [4] 'manual_opened' task is no longer returned in pending task queue");
    } else {
      throw new Error("TEST 4 FAILED: 'manual_opened' task remained in pending task queue!");
    }

    // ----------------------------------------------------
    // TEST 6, 7 & 14: Failed Task Retry Workflow & Retry Attempt Limit (Max 3)
    // ----------------------------------------------------
    console.log("\n[TEST 6, 7 & 14] Verifying Failed Automatic Message Retry & Max Limit...");
    // Attempt 1 -> 2
    const mockResRetry1 = createMockRes();
    await retryCommunication({ params: { id: taskHostelAFailed._id }, user: { role: "super_admin" } }, mockResRetry1);
    
    // Attempt 2 -> 3
    const mockResRetry2 = createMockRes();
    await retryCommunication({ params: { id: taskHostelAFailed._id }, user: { role: "super_admin" } }, mockResRetry2);

    // Attempt 3 -> 4 (should be blocked)
    const mockResRetry3 = createMockRes();
    await retryCommunication({ params: { id: taskHostelAFailed._id }, user: { role: "super_admin" } }, mockResRetry3);

    const finalFailedTask = await Communication.findById(taskHostelAFailed._id);
    if (mockResRetry3.statusCode === 400 && mockResRetry3.body?.requires_admin_action && finalFailedTask.attemptCount >= 3) {
      console.log(`✓ PASS [6, 7 & 14] Retry limit of 3 enforced properly: Status '${finalFailedTask.status}', requires_admin_action: true`);
    } else {
      throw new Error(`TEST 6/7/14 FAILED: Expected retry blocking after 3 attempts, got status ${mockResRetry3.statusCode}`);
    }

    // ----------------------------------------------------
    // TEST 12, 15, 16 & 17: Task Detail View & Secret / Password Non-Leakage
    // ----------------------------------------------------
    console.log("\n[TEST 12, 15, 16 & 17] Verifying Task Detail & Secret Redaction in API & Logs...");
    const mockResDetail = createMockRes();
    await getCommunicationDetail({ params: { id: taskAdminOwner._id }, user: { role: "super_admin" } }, mockResDetail);

    const detailData = mockResDetail.body?.communication;
    const allLogs = loggedMessages.join("\n");

    const noRawPassInDetail = !detailData.message.includes("TempPass_Secret_999");
    const noRawPassInLogs = !allLogs.includes("TempPass_Secret_999");
    const noMetaTokenInLogs = !allLogs.includes("EAAG_");
    const noJwtInLogs = !allLogs.includes("eyJhbGciOi");

    if (noRawPassInDetail && noRawPassInLogs && noMetaTokenInLogs && noJwtInLogs) {
      console.log("✓ PASS [12, 15, 16 & 17] Task details accessible with zero password, Meta token, or JWT leakage in API or logs!");
    } else {
      throw new Error("TEST 12/15/16/17 FAILED: Sensitive credentials leaked in detail API or application logs!");
    }

    console.log("\n==================================================");
    console.log("🎉 ALL 18 ADMIN TODAY'S TASKS TESTS PASSED!");
    console.log("==================================================");
  } finally {
    console.log = origLog;
    console.warn = origWarn;
    console.error = origError;
    await mongoose.disconnect();
    console.log("\nDisconnected from MongoDB.\n");
  }
}

runAdminTodayTasksSuite().catch((err) => {
  console.error("❌ ADMIN TODAY'S TASKS SUITE FAILED:", err);
  process.exit(1);
});
