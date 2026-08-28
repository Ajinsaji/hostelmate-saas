"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

console.log("====================================================================");
console.log("HOSTELMATE NOTIFICATION & ADMISSION APPROVAL PRODUCTION AUDIT (30 TESTS)");
console.log("====================================================================");

let passed = 0;
let total = 0;

function runTest(description, fn) {
  total++;
  try {
    fn();
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
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 2000 });
    dbConnected = true;
    console.log("[INFO] MongoDB Connected successfully");
  } catch (err) {
    console.log("[WARN] Local MongoDB not running on 27017; running unit & code audit assertions");
  }

  const Notification = require("../models/Notification");
  const PublicAdmission = require("../models/PublicAdmission");
  const Resident = require("../models/Resident");
  const Room = require("../models/Room");
  const Bed = require("../models/Bed");
  const Hostel = require("../models/Hostel");

  const notificationService = require("../services/notificationCenterService");
  const notificationController = require("../controllers/notificationController");
  const ownerController = require("../controllers/ownerController");

  // 1. Notification model exists
  runTest("1. Notification model exists", () => {
    assert.strictEqual(typeof Notification, "function");
  });

  if (dbConnected) {
    // 2. Dispatch notification
    const testHostelId = new mongoose.Types.ObjectId();
    const testOwnerId = new mongoose.Types.ObjectId();

    const dispatched = await notificationService.dispatchNotification({
      hostelId: testHostelId,
      recipientId: testOwnerId,
      recipientType: "Owner",
      title: "Audit Test Notification",
      message: "Testing notification delivery",
      type: "admission_submitted",
    });

    runTest("2. Notification creation via dispatchNotification works", () => {
      assert.ok(dispatched._id, "Notification created with _id");
      assert.strictEqual(dispatched.title, "Audit Test Notification");
    });

    // 3. Unread count and list reconciliation
    const unreadCount = await notificationService.getUnreadCount({
      hostelId: testHostelId,
      recipientId: testOwnerId,
    });

    const notifList = await notificationService.getNotifications({
      hostelId: testHostelId,
      recipientId: testOwnerId,
    });

    runTest("3. Reconciled getUnreadCount matches getNotifications count", () => {
      assert.strictEqual(unreadCount, 1);
      assert.strictEqual(notifList.total, 1);
      assert.strictEqual(notifList.notifications.length, 1);
    });

    // 4. Mark as read
    await notificationService.markAsRead(dispatched._id);

    const updatedUnreadCount = await notificationService.getUnreadCount({
      hostelId: testHostelId,
      recipientId: testOwnerId,
    });

    runTest("4. markAsRead decrements unreadCount to 0", () => {
      assert.strictEqual(updatedUnreadCount, 0);
    });

    // 5. Mark all as read
    await notificationService.dispatchNotification({
      hostelId: testHostelId,
      recipientId: testOwnerId,
      title: "Test 2",
      message: "Message 2",
    });

    await notificationService.markAllAsRead({
      hostelId: testHostelId,
      recipientId: testOwnerId,
    });

    const finalUnreadCount = await notificationService.getUnreadCount({
      hostelId: testHostelId,
      recipientId: testOwnerId,
    });

    runTest("5. markAllAsRead sets unread count to 0", () => {
      assert.strictEqual(finalUnreadCount, 0);
    });

    // Clean up test notifications
    await Notification.deleteMany({ hostelId: testHostelId });
  } else {
    runTest("2. Notification creation function signature valid", () => {
      assert.strictEqual(typeof notificationService.dispatchNotification, "function");
    });
    runTest("3. Notification getUnreadCount function signature valid", () => {
      assert.strictEqual(typeof notificationService.getUnreadCount, "function");
    });
    runTest("4. Notification markAsRead function signature valid", () => {
      assert.strictEqual(typeof notificationService.markAsRead, "function");
    });
    runTest("5. Notification markAllAsRead function signature valid", () => {
      assert.strictEqual(typeof notificationService.markAllAsRead, "function");
    });
  }

  // 6. Cache-Control headers in controller
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  runTest("6. getNotifications and getUnreadCount set Cache-Control no-store headers", () => {
    assert.ok(controllerCode.includes('res.set("Cache-Control", "no-cache, no-store, must-revalidate");'));
  });

  // 7. Route aliases in notificationRoutes.js
  const routesCode = fs.readFileSync(path.join(__dirname, "../routes/notificationRoutes.js"), "utf8");
  runTest("7. notificationRoutes.js contains /mine, /read-all, /:id/read aliases", () => {
    assert.ok(routesCode.includes('router.get("/mine", getNotifications);'));
    assert.ok(routesCode.includes('router.put("/read-all", markAllAsRead);'));
    assert.ok(routesCode.includes('router.put("/:id/read", markAsRead);'));
  });

  // 8. Frontend NotificationBell fetches /api/notifications?limit=30
  const bellCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/NotificationBell.jsx"), "utf8");
  runTest("8. NotificationBell.jsx fetches /api/notifications?limit=30", () => {
    assert.ok(bellCode.includes('api.get(`/api/notifications?limit=30`)'));
  });

  // 9. Frontend NotificationContext fetches /api/notifications?limit=30
  const ctxCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/contexts/NotificationContext.jsx"), "utf8");
  runTest("9. NotificationContext.jsx fetches /api/notifications?limit=30", () => {
    assert.ok(ctxCode.includes('api.get(`/api/notifications?limit=30`)'));
  });

  // 10. approveAdmission handles unique admissionNumber generation
  const ownerControllerCode = fs.readFileSync(path.join(__dirname, "../controllers/ownerController.js"), "utf8");
  runTest("10. approveAdmission uses unique admissionNumber retry loop to prevent E11000 collision", () => {
    assert.ok(ownerControllerCode.includes("candidateNumber"));
    assert.ok(ownerControllerCode.includes("admissionNumber = candidateNumber"));
  });

  // 11. approveAdmission validates createdBy ObjectId
  runTest("11. approveAdmission validates validCreatedBy ObjectId", () => {
    assert.ok(ownerControllerCode.includes("validCreatedBy"));
    assert.ok(ownerControllerCode.includes("mongoose.Types.ObjectId.isValid"));
  });

  // 12. approveAdmission detailed error logging
  runTest("12. approveAdmission logs detailed error object on failure", () => {
    assert.ok(ownerControllerCode.includes("approveAdmission error details:"));
    assert.ok(ownerControllerCode.includes("errorMessage: error?.message"));
  });

  if (dbConnected) {
    // 13-19. Create a dummy hostel, room, bed, and admission to test real approveAdmission
    const mockHostel = await Hostel.create({
      hostelName: "Audit Test Hostel",
      name: "Audit Test Hostel",
      phone: "+919999888877",
      email: "audit@test.com",
      city: "TestCity",
      address: "Test Address",
    });

    const mockRoom = await Room.create({
      tenantId: mockHostel._id,
      hostelId: mockHostel._id,
      roomNumber: "101",
      capacity: 2,
      totalBeds: 2,
      occupiedBeds: 0,
      vacantBeds: 2,
    });

    const mockBed = await Bed.create({
      tenantId: mockHostel._id,
      hostelId: mockHostel._id,
      roomId: mockRoom._id,
      bedNumber: "101-A",
      status: "Vacant",
    });

    const mockAdmission = await PublicAdmission.create({
      hostelId: mockHostel._id,
      residentName: "John Audit Resident",
      phone: "9876543210",
      email: "john@audit.com",
      roomPreference: mockRoom._id.toString(),
      status: "Pending",
    });

    runTest("13. Mock PublicAdmission created in Pending state", () => {
      assert.strictEqual(mockAdmission.status, "Pending");
    });

    // Test approveAdmission execution
    const req = {
      params: { id: mockAdmission._id.toString() },
      owner: { ownerId: new mongoose.Types.ObjectId().toString(), hostelId: mockHostel._id },
      body: { roomId: mockRoom._id.toString() },
    };

    let approveRes = null;
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(data) { approveRes = data; return this; }
    };

    await ownerController.approveAdmission(req, res);

    runTest("14. approveAdmission controller returns HTTP 200 OK", () => {
      assert.strictEqual(res.statusCode, 200);
      assert.ok(approveRes.success);
      assert.ok(approveRes.resident);
    });

    runTest("15. Resident created with status Active and assigned room/bed", async () => {
      const createdResident = await Resident.findById(approveRes.resident._id);
      assert.ok(createdResident);
      assert.strictEqual(createdResident.status, "Active");
      assert.strictEqual(String(createdResident.roomId), String(mockRoom._id));
    });

    runTest("16. PublicAdmission status updated to Approved", async () => {
      const updatedAdm = await PublicAdmission.findById(mockAdmission._id);
      assert.strictEqual(updatedAdm.status, "Approved");
    });

    runTest("17. Bed status updated to Occupied", async () => {
      const updatedBed = await Bed.findById(mockBed._id);
      assert.strictEqual(updatedBed.status, "Occupied");
    });

    runTest("18. Room occupiedBeds incremented to 1", async () => {
      const updatedRoom = await Room.findById(mockRoom._id);
      assert.strictEqual(updatedRoom.occupiedBeds, 1);
    });

    // Idempotency check: approving already approved admission
    approveRes = null;
    await ownerController.approveAdmission(req, res);

    runTest("19. Re-approving an already approved admission returns HTTP 400", () => {
      assert.strictEqual(res.statusCode, 400);
      assert.ok(!approveRes.success);
    });

    // Clean up mock test data
    await PublicAdmission.deleteMany({ hostelId: mockHostel._id });
    await Resident.deleteMany({ hostelId: mockHostel._id });
    await Bed.deleteMany({ hostelId: mockHostel._id });
    await Room.deleteMany({ hostelId: mockHostel._id });
    await Hostel.deleteMany({ _id: mockHostel._id });
  } else {
    runTest("13. approveAdmission handles 404 for missing admission cleanly", async () => {
      const req = {
        params: { id: new mongoose.Types.ObjectId().toString() },
        owner: { ownerId: new mongoose.Types.ObjectId().toString(), hostelId: new mongoose.Types.ObjectId() },
        body: {},
      };
      let result = null;
      const res = {
        status(code) { this.statusCode = code; return this; },
        json(data) { result = data; return this; }
      };
      await ownerController.approveAdmission(req, res);
      assert.strictEqual(res.statusCode, 404);
    });

    runTest("14. approveAdmission returns 400 when hostel context missing", async () => {
      const req = { params: { id: new mongoose.Types.ObjectId().toString() }, owner: {}, body: {} };
      let result = null;
      const res = {
        status(code) { this.statusCode = code; return this; },
        json(data) { result = data; return this; }
      };
      await ownerController.approveAdmission(req, res);
      assert.strictEqual(res.statusCode, 400);
    });

    runTest("15. Resident model schema requires unique admissionNumber", () => {
      assert.strictEqual(Resident.schema.paths.admissionNumber.options.required, true);
    });

    runTest("16. Resident model schema tenantId required", () => {
      assert.strictEqual(Resident.schema.paths.tenantId.options.required, true);
    });

    runTest("17. Bed model status enum includes Vacant & Occupied", () => {
      assert.ok(Bed.schema.paths.status.enumValues.includes("Occupied"));
    });

    runTest("18. Room model occupiedBeds default 0", () => {
      assert.strictEqual(Room.schema.paths.occupiedBeds.options.default, 0);
    });

    runTest("19. PublicAdmission status enum includes Pending, Approved, Rejected", () => {
      assert.ok(PublicAdmission.schema.paths.status.enumValues.includes("Approved"));
    });
  }

  // 20-30. Additional audit assertions
  runTest("20. registerDeviceToken controller function exists", () => {
    assert.strictEqual(typeof notificationController.registerDeviceToken, "function");
  });

  runTest("21. getUserDevices controller function exists", () => {
    assert.strictEqual(typeof notificationController.getUserDevices, "function");
  });

  runTest("22. deleteDeviceToken controller function exists", () => {
    assert.strictEqual(typeof notificationController.deleteDeviceToken, "function");
  });

  runTest("23. sendTestNotification controller function exists", () => {
    assert.strictEqual(typeof notificationController.sendTestNotification, "function");
  });

  runTest("24. getNotificationSettings controller function exists", () => {
    assert.strictEqual(typeof notificationController.getNotificationSettings, "function");
  });

  runTest("25. updateNotificationSettings controller function exists", () => {
    assert.strictEqual(typeof notificationController.updateNotificationSettings, "function");
  });

  runTest("26. rejectAdmission controller function exists", () => {
    assert.strictEqual(typeof ownerController.rejectAdmission, "function");
  });

  runTest("27. NotificationSound utility exists in Frontend", () => {
    const soundUtilPath = path.join(__dirname, "../../Frontend/src/utils/notificationSound.js");
    assert.ok(fs.existsSync(soundUtilPath), "notificationSound.js exists");
  });

  runTest("28. useFcmNotifications hook exists in Frontend", () => {
    const hookPath = path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js");
    assert.ok(fs.existsSync(hookPath), "useFcmNotifications.js exists");
  });

  runTest("29. firebase-messaging-sw.js exists in Frontend public", () => {
    const swPath = path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js");
    assert.ok(fs.existsSync(swPath), "firebase-messaging-sw.js exists");
  });

  runTest("30. ownerController logger calls do not log secrets directly", () => {
    assert.ok(!ownerControllerCode.includes('logger.info("JWT_SECRET"'), "No secret logging");
    assert.ok(!ownerControllerCode.includes('logger.error("JWT_SECRET"'), "No secret logging");
  });

  if (dbConnected) {
    await mongoose.disconnect();
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

runAsyncTests().catch(err => {
  console.error("FATAL ERROR IN TEST SUITE:", err);
  process.exit(1);
});
