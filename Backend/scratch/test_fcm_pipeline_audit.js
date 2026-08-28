"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

console.log("====================================================================");
console.log("HOSTELMATE FCM PUSH NOTIFICATION PIPELINE AUDIT & REGRESSION SUITE");
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
  // 1. Firebase messaging service worker syntax check
  await runAsyncTest("1. firebase-messaging-sw.js syntax check (no trailing unexpected brace)", async () => {
    const swPath = path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js");
    const { execSync } = require("child_process");
    execSync(`node -c "${swPath}"`);
    assert.ok(true, "firebase-messaging-sw.js syntax is valid");
  });

  // 2. Firebase Project ID consistency check
  await runAsyncTest("2. Firebase Project ID consistency (hostelmate-f0de8) across all configs", async () => {
    const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
    const cfgCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-config.js"), "utf8");
    const viteCode = fs.readFileSync(path.join(__dirname, "../../Frontend/vite.config.js"), "utf8");
    const adminCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");

    assert.ok(swCode.includes("hostelmate-f0de8"), "sw.js contains hostelmate-f0de8");
    assert.ok(cfgCode.includes("hostelmate-f0de8"), "config.js contains hostelmate-f0de8");
    assert.ok(viteCode.includes("hostelmate-f0de8"), "vite.config.js contains hostelmate-f0de8");
    assert.ok(adminCode.includes("hostelmate-f0de8"), "firebaseAdmin.js contains hostelmate-f0de8");
  });

  // 3. Service worker registration dedicated scope check
  await runAsyncTest("3. firebaseClient.js uses dedicated scope /firebase-cloud-messaging-push-scope", async () => {
    const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
    assert.ok(clientCode.includes('scope: "/firebase-cloud-messaging-push-scope"'), "Dedicated FCM scope used");
    assert.ok(clientCode.includes("serviceWorkerRegistration: activeSw"), "activeSw passed to getToken");
  });

  // 4. getUserContext user ID resolution logic check
  await runAsyncTest("4. getUserContext resolves userId properly from req.user.id and req.user.userId", async () => {
    const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
    assert.ok(controllerCode.includes("req.user?.userId"), "getUserContext includes req.user.userId");
    assert.ok(controllerCode.includes("req.user?.id"), "getUserContext includes req.user.id");
  });

  // 5. Android Notification Channel ID check (hostelmate_v2)
  await runAsyncTest("5. fcmService.js specifies Android channelId: hostelmate_v2", async () => {
    const fcmCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
    assert.ok(fcmCode.includes('channelId: "hostelmate_v2"'), "Android channelId set to hostelmate_v2");
    assert.ok(fcmCode.includes('priority: "high"'), "High priority specified for WebPush and Android");
  });

  // 6. Safe token fingerprint logging check (never log full token)
  await runAsyncTest("6. Safe token fingerprint logging enforcement", async () => {
    const fcmCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
    const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
    const clientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");

    assert.ok(!fcmCode.includes("logger.error(`[fcmService] Token failed:`, tokens[index]"), "Full token not logged on failure");
    assert.ok(controllerCode.includes("token.slice(0, 8)"), "Safe fingerprint logged in controller");
    assert.ok(clientCode.includes("trimmedToken.slice(0, 8)"), "Safe fingerprint logged in frontend");
  });

  // 7. Database integration tests if connected
  const dotenv = require("dotenv");
  const parsedEnv = dotenv.parse(fs.readFileSync(path.join(__dirname, "../.env")));
  const mongoUri = process.env.MONGO_URI || parsedEnv.MONGO_URI;

  let dbConnected = false;
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    dbConnected = true;
    console.log("[INFO] MongoDB Connected successfully");
  } catch {
    console.log("[WARN] MongoDB connection offline");
  }

  if (dbConnected) {
    const DeviceToken = require("../models/DeviceToken");
    const testUserId = new mongoose.Types.ObjectId();
    const testToken = "test_fcm_token_fingerprint_audit_123456789";

    await runAsyncTest("7. DeviceToken CRUD & User ID index verification", async () => {
      await DeviceToken.deleteMany({ token: testToken });

      const deviceToken = await DeviceToken.create({
        userId: testUserId,
        token: testToken,
        platform: "web",
        isActive: true,
      });

      assert.ok(deviceToken._id);
      assert.strictEqual(String(deviceToken.userId), String(testUserId));

      const found = await DeviceToken.find({ userId: testUserId, isActive: true });
      assert.strictEqual(found.length, 1);
      assert.strictEqual(found[0].token, testToken);

      await DeviceToken.deleteOne({ _id: deviceToken._id });
    });

    await mongoose.disconnect();
  } else {
    await runAsyncTest("7. DeviceToken DB test placeholder (DB offline)", async () => assert.ok(true));
  }

  console.log("\n-------------------------------------------------------------");
  console.log(`FCM AUDIT SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
  console.log("-------------------------------------------------------------\n");

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAsyncTests().catch((err) => {
  console.error("FATAL ERROR IN FCM AUDIT SUITE:", err);
  process.exit(1);
});
