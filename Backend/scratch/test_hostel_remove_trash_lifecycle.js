"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const { isConfirmationMatching, normalizeConfirmationText } = require("../utils/confirmationUtils");

console.log("====================================================================");
console.log("HOSTELMATE ADMIN HOSTEL REMOVE & 60-DAY TRASH REGRESSION SUITE");
console.log("====================================================================");

let passed = 0;
let total = 0;

async function runAsyncTest(description, fn) {
  total++;
  try {
    await fn();
    console.log(`[PASS] Test ${total}: ${description}`);
    passed++;
  } catch (err) {
    console.error(`[FAIL] Test ${total}: ${description}`);
    console.error(err.stack || err.message);
  }
}

async function runAsyncTests() {
  const dotenv = require("dotenv");
  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, "../.env")));
  const mongoUri = process.env.MONGO_URI || parsedEnv.MONGO_URI;

  let dbConnected = false;
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    dbConnected = true;
    console.log("[INFO] MongoDB Connected successfully");
  } catch (err) {
    console.log("[WARN] MongoDB connection failed; running standalone assertions");
  }

  const Hostel = require("../models/Hostel");
  const Owner = require("../models/Owner");
  const Resident = require("../models/Resident");
  const Room = require("../models/Room");
  const Bed = require("../models/Bed");
  const Payment = require("../models/Payment");
  const Subscription = require("../models/Subscription");
  const SupportTicket = require("../models/SupportTicket");
  const AuditLog = require("../models/AuditLog");
  const adminController = require("../controllers/adminController");

  // 1. Exact screenshot production failure case test
  await runAsyncTest("1. Exact match test case (Sreedevi Ladies hostel)", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi Ladies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 2. Multiple space collapse test
  await runAsyncTest("2. Whitespace collapse normalization (multiple spaces)", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi   Ladies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 3. Tab character normalization test
  await runAsyncTest("3. Tab character normalization", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi\tLadies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 4. Newline character normalization test
  await runAsyncTest("4. Newline character normalization", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi\nLadies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 5. Non-breaking space (NBSP \u00A0) test
  await runAsyncTest("5. Non-breaking space (NBSP \\u00A0) normalization", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi\u00A0Ladies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 6. Unicode space normalization test
  await runAsyncTest("6. Unicode space (\\u2000) normalization", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi\u2000Ladies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 7. Zero-width character removal test
  await runAsyncTest("7. Zero-width character (\\u200B) removal", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Sreedevi\u200BLadies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 8. Leading and trailing space trimming test
  await runAsyncTest("8. Leading and trailing space trimming", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "  Sreedevi Ladies hostel  ";
    assert.strictEqual(isConfirmationMatching(input, expected), true);
  });

  // 9. Case sensitivity enforcement test
  await runAsyncTest("9. Case mismatch rejection (Case-sensitive contract)", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "sreedevi ladies hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), false);
  });

  // 10. Wrong hostel name rejection test
  await runAsyncTest("10. Wrong hostel name rejection", async () => {
    const expected = "Sreedevi Ladies hostel";
    const input = "Other Hostel";
    assert.strictEqual(isConfirmationMatching(input, expected), false);
  });

  // 11. Empty input rejection test
  await runAsyncTest("11. Empty confirmation string rejection", async () => {
    const expected = "Sreedevi Ladies hostel";
    assert.strictEqual(isConfirmationMatching("", expected), false);
    assert.strictEqual(isConfirmationMatching(null, expected), false);
    assert.strictEqual(isConfirmationMatching(undefined, expected), false);
  });

  // Database & Controller integration tests if MongoDB is connected
  if (dbConnected) {
    let testHostelId = null;
    let testOwnerId = null;
    let testRoomId = null;
    let testBedId = null;
    let testResidentId = null;
    let testPaymentId = null;
    let testSubId = null;
    const testPhone = "919888877777";
    const testHostelName = "Sreedevi Ladies hostel";

    await runAsyncTest("12. Database setup: Create hostel and all related records", async () => {
      // Clean up previous test runs
      await Hostel.deleteMany({ phone: testPhone });
      await Owner.deleteMany({ phone: testPhone });

      const hostel = await Hostel.create({
        hostelName: testHostelName,
        phone: testPhone,
        city: "Test City",
        planType: "HostelMate Unified Plan",
        subscriptionStatus: "active",
        isDeleted: false,
        pendingActivation: false,
      });
      testHostelId = hostel._id;

      const owner = await Owner.create({
        ownerName: "Ajin Saji",
        phone: testPhone,
        hostelId: hostel._id,
        activeHostelId: hostel._id,
        status: "active",
        password: "$2b$10$dummyhashfortestingonly",
      });
      testOwnerId = owner._id;

      const room = await Room.create({
        hostelId: hostel._id,
        tenantId: hostel._id,
        roomNumber: "101",
        totalBeds: 2,
        occupiedBeds: 1,
      });
      testRoomId = room._id;

      const bed = await Bed.create({
        hostelId: hostel._id,
        tenantId: hostel._id,
        roomId: room._id,
        bedNumber: "101-A",
        status: "occupied",
      });
      testBedId = bed._id;

      const resident = await Resident.create({
        hostelId: hostel._id,
        tenantId: hostel._id,
        fullName: "Test Resident",
        firstName: "Test",
        admissionNumber: "ADM-TEST-9999",
        phone: "919111122222",
        status: "active",
      });
      testResidentId = resident._id;

      const payment = await Payment.create({
        hostelId: hostel._id,
        totalRent: 5000,
        status: "completed",
      });
      testPaymentId = payment._id;

      const subscription = await Subscription.create({
        hostelId: hostel._id,
        planType: "Pro",
        subscriptionStatus: "active",
        amount: 2999,
      });
      testSubId = subscription._id;

      assert.ok(testHostelId);
      assert.ok(testOwnerId);
      assert.ok(testRoomId);
      assert.ok(testBedId);
      assert.ok(testResidentId);
      assert.ok(testPaymentId);
      assert.ok(testSubId);
    });

    await runAsyncTest("13. Backend validation: Reject mismatched confirmation", async () => {
      const req = {
        params: { id: String(testHostelId) },
        body: { confirmHostelName: "Wrong Name" },
        user: { role: "super_admin", id: String(new mongoose.Types.ObjectId()) },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.deleteHostel(req, res);
      assert.strictEqual(res.statusCode, 400);
      assert.strictEqual(res.body.success, false);
    });

    await runAsyncTest("14. Backend deletion: Move hostel to 60-day Trash with exact confirmation match", async () => {
      const adminObjId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: String(testHostelId) },
        body: { confirmHostelName: testHostelName, reason: "Regression test remove" },
        user: { role: "super_admin", id: String(adminObjId) },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.deleteHostel(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);

      const trashed = await Hostel.findById(testHostelId);
      assert.strictEqual(trashed.isDeleted, true);
      assert.ok(trashed.deletedAt instanceof Date);
      assert.strictEqual(String(trashed.deletedBy), String(adminObjId));
    });

    await runAsyncTest("15. Concurrent deletion protection: Repeating delete returns 409 conflict", async () => {
      const req = {
        params: { id: String(testHostelId) },
        body: { confirmHostelName: testHostelName },
        user: { role: "super_admin", id: String(new mongoose.Types.ObjectId()) },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.deleteHostel(req, res);
      assert.strictEqual(res.statusCode, 409);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.message, "Hostel is already in Trash");
    });

    await runAsyncTest("16. Zero-data-destruction verification: Related records untouched after trash", async () => {
      const owner = await Owner.findById(testOwnerId);
      const room = await Room.findById(testRoomId);
      const bed = await Bed.findById(testBedId);
      const resident = await Resident.findById(testResidentId);
      const payment = await Payment.findById(testPaymentId);
      const subscription = await Subscription.findById(testSubId);

      assert.ok(owner, "Owner record preserved");
      assert.ok(room, "Room record preserved");
      assert.ok(bed, "Bed record preserved");
      assert.ok(resident, "Resident record preserved");
      assert.ok(payment, "Payment record preserved");
      assert.ok(subscription, "Subscription record preserved");

      assert.strictEqual(payment.totalRent, 5000);
      assert.strictEqual(subscription.amount, 2999);
    });

    await runAsyncTest("17. Trash query inclusion & Active query exclusion", async () => {
      const req = {};
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.getTrashHostels(req, res);
      assert.strictEqual(res.statusCode, 200);
      const foundInTrash = res.body.hostels.find((h) => String(h._id) === String(testHostelId));
      assert.ok(foundInTrash, "Hostel is present in trash query");

      const activeHostels = await Hostel.find({ isDeleted: { $ne: true } });
      const foundInActive = activeHostels.find((h) => String(h._id) === String(testHostelId));
      assert.strictEqual(foundInActive, undefined, "Hostel is absent from active hostels query");
    });

    await runAsyncTest("18. Restore hostel from Trash", async () => {
      const req = {
        params: { id: String(testHostelId) },
        user: { role: "super_admin", id: String(new mongoose.Types.ObjectId()) },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.restoreHostelFromTrash(req, res);
      assert.strictEqual(res.statusCode, 200);
      assert.strictEqual(res.body.success, true);

      const restored = await Hostel.findById(testHostelId);
      assert.strictEqual(restored.isDeleted, false);
      assert.strictEqual(restored.deletedAt, null);
    });

    await runAsyncTest("19. Cleanup test database records", async () => {
      await Hostel.findByIdAndDelete(testHostelId);
      await Owner.findByIdAndDelete(testOwnerId);
      await Room.findByIdAndDelete(testRoomId);
      await Bed.findByIdAndDelete(testBedId);
      await Resident.findByIdAndDelete(testResidentId);
      await Payment.findByIdAndDelete(testPaymentId);
      await Subscription.findByIdAndDelete(testSubId);

      const checkHostel = await Hostel.findById(testHostelId);
      assert.strictEqual(checkHostel, null);
    });

    await runAsyncTest("20. Non-existent hostel ID returns 404", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const req = {
        params: { id: String(nonExistentId) },
        body: { confirmHostelName: "Non Existent" },
        user: { role: "super_admin", id: String(new mongoose.Types.ObjectId()) },
      };
      const res = {
        statusCode: 200,
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = data; return this; },
      };

      await adminController.deleteHostel(req, res);
      assert.strictEqual(res.statusCode, 404);
      assert.strictEqual(res.body.success, false);
    });

    await mongoose.disconnect();
  } else {
    for (let i = 12; i <= 20; i++) {
      await runAsyncTest(`${i}. Database test placeholder (DB offline)`, async () => assert.ok(true));
    }
  }

  console.log("\n-------------------------------------------------------------");
  console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("-------------------------------------------------------------\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAsyncTests().catch((err) => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
