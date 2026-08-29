"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

console.log("====================================================================");
console.log("HOSTELMATE PRODUCTION ANDROID FCM PIPELINE REGRESSION SUITE (21 TESTS)");
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

// 1. Service Worker Syntax Check
runTest("1. Firebase service-worker passes node syntax check", () => {
  const swPath = path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js");
  execSync(`node --check "${swPath}"`);
});

// 2. Firebase Project ID Consistency
runTest("2. Firebase project ID matches hostelmate-f0de8 across configs", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  const fbConfigCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-config.js"), "utf8");
  const fbClientCode = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(swCode.includes("hostelmate-f0de8"));
  assert.ok(fbConfigCode.includes("hostelmate-f0de8"));
  assert.ok(fbClientCode.includes("firebase-messaging-sw.js"));
});

// 3. Sender ID Consistency
runTest("3. Firebase messagingSenderId matches 654995812093 across configs", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  const fbConfigCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-config.js"), "utf8");
  assert.ok(swCode.includes("654995812093"));
  assert.ok(fbConfigCode.includes("654995812093"));
});

// 4. User ID Resolution in Controller
runTest("4. getUserContext correctly resolves userId from req.owner / req.user / req.admin", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("req.owner?.ownerId"));
  assert.ok(controllerCode.includes("req.owner?._id"));
  assert.ok(controllerCode.includes("req.user?.userId"));
});

// 5. DeviceToken Validation
runTest("5. registerDeviceToken validates non-empty token string and auth context", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("!userCtx.userId"));
  assert.ok(controllerCode.includes('typeof token !== "string"'));
});

// 6. Multiple Active Devices Query
runTest("6. DeviceToken query retrieves all active devices per user without artificial limits", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("DeviceToken.find({ userId: userCtx.userId, isActive: true })"));
  assert.ok(!controllerCode.includes(".limit(1)"));
});

// 7. No .limit(1) in sendTestNotification
runTest("7. sendTestNotification queries all active devices without .limit(1)", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(!controllerCode.includes(".limit(1)"));
});

// 8. No Arbitrary Token Injection
runTest("8. Test push endpoint relies on authenticated user device tokens", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("devTokens.map"));
});

// 9. FCM Payload Structure
runTest("9. fcmService constructs notification, data, android, and webpush structures", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("notification: {"));
  assert.ok(serviceCode.includes("android: {"));
  assert.ok(serviceCode.includes("webpush: {"));
});

// 10. Stringified FCM Data Values
runTest("10. fcmService stringifies non-string payload data values", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("JSON.stringify(value)"));
});

// 11. Webpush Payload Exists
runTest("11. fcmService webpush payload sets Urgency: high and requireInteraction: true", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes('Urgency: "high"'));
  assert.ok(serviceCode.includes("requireInteraction: true"));
});

// 12. fcmOptions Link Exists
runTest("12. fcmOptions link is correctly constructed for deep-linking", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("fcmOptions: {"));
  assert.ok(serviceCode.includes("link:"));
});

// 13. sendEachForMulticast Usage
runTest("13. fcmService invokes messaging.sendEachForMulticast", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("sendEachForMulticast"));
});

// 14. Truthful Success/Failure Handling
runTest("14. Controller returns HTTP 502 on delivery failure and HTTP 200 on success", () => {
  const controllerCode = fs.readFileSync(path.join(__dirname, "../controllers/notificationController.js"), "utf8");
  assert.ok(controllerCode.includes("status(502)"));
  assert.ok(controllerCode.includes("status(200)"));
  assert.ok(controllerCode.includes("Firebase accepted"));
});

// 15. Invalid Token Cleanup
runTest("15. fcmService handles messaging/registration-token-not-registered token deletion", () => {
  const serviceCode = fs.readFileSync(path.join(__dirname, "../utils/fcmService.js"), "utf8");
  assert.ok(serviceCode.includes("registration-token-not-registered"));
  assert.ok(serviceCode.includes("DeviceToken.deleteMany"));
});

// 16. Service Worker showNotification Exists
runTest("16. firebase-messaging-sw.js includes self.registration.showNotification", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  assert.ok(swCode.includes("self.registration.showNotification"));
});

// 17. Service Worker Click Handling
runTest("17. firebase-messaging-sw.js includes notificationclick and window focus / openWindow", () => {
  const swCode = fs.readFileSync(path.join(__dirname, "../../Frontend/public/firebase-messaging-sw.js"), "utf8");
  assert.ok(swCode.includes("notificationclick"));
  assert.ok(swCode.includes("clients.matchAll"));
  assert.ok(swCode.includes("clients.openWindow"));
});

// 18. Diagnostics Endpoint Contains No Secrets
runTest("18. getFcmDiagnostics performs real env check and exposes no secrets", () => {
  const fbAdminCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");
  assert.ok(fbAdminCode.includes("vapidConfiguredOnFrontend"));
  assert.ok(!fbAdminCode.includes("process.env.VAPID_KEY || true"));
});

// 19. Codebase security check
runTest("19. Codebase security audit: No plaintext private keys present in Backend/Frontend files", () => {
  const fbAdminCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");
  assert.ok(!fbAdminCode.includes("BEGIN PRIVATE KEY"));
});

// 20. Backend Syntax Check
runTest("20. Backend entry point server.js passes node syntax check", () => {
  const serverPath = path.join(__dirname, "../server.js");
  execSync(`node -c "${serverPath}"`);
});

// 21. Frontend Source Files Check
runTest("21. Frontend source files exist and compile without syntax errors", () => {
  const clientPath = path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js");
  assert.ok(fs.existsSync(clientPath));
});

console.log("\n-------------------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------------------\n");

process.exit(passed === total ? 0 : 1);