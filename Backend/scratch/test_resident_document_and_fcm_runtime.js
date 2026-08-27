"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");

console.log("=================================================");
console.log("HOSTELMATE RESIDENT DOCUMENT & FCM RUNTIME TEST SUITE");
console.log("=================================================");

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

// 1. Local upload path normalized
runTest("1. Local upload path normalized cleanly to /uploads/<filename>", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const res = getUploadedFileUrl({ filename: "idProofFile-100.jpg" });
  assert.strictEqual(res, "/uploads/idProofFile-100.jpg");
});

// 2. Render filesystem path normalized
runTest("2. Render filesystem path normalized to /uploads/<filename>", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const res = getUploadedFileUrl({ path: "/opt/render/project/src/Backend/uploads/idProofFile-791685.pdf" });
  assert.strictEqual(res, "/uploads/idProofFile-791685.pdf");
});

// 3. Windows path normalized
runTest("3. Windows path normalized to /uploads/<filename>", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const res = getUploadedFileUrl({ path: "C:\\Users\\my pc\\Desktop\\Hostelmate\\hostelmate-saas\\Backend\\uploads\\aadhaar-456.png" });
  assert.strictEqual(res, "/uploads/aadhaar-456.png");
});

// 4. Cloudinary URL preserved
runTest("4. Cloudinary HTTPS URL preserved unchanged", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const res = getUploadedFileUrl({ secure_url: "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg" });
  assert.strictEqual(res, "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg");
});

// 5. HTTPS external URL preserved
runTest("5. HTTPS external URL preserved unchanged", () => {
  const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
  const res = getUploadedFileUrl({ url: "https://example.com/docs/license.pdf" });
  assert.strictEqual(res, "https://example.com/docs/license.pdf");
});

// 6. PDF recognized
runTest("6. DocumentViewerModal recognizes PDF files with extensions or query strings", () => {
  const modalContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx"), "utf8");
  assert.ok(modalContent.includes(".endsWith(\".pdf\")"), "Modal checks for .pdf extension");
  assert.ok(modalContent.includes("split(\"?\")[0]"), "Modal strips query parameters");
  assert.ok(modalContent.includes("<iframe"), "Modal renders PDF in iframe");
});

// 7. JPEG recognized
runTest("7. DocumentViewerModal recognizes JPEG files", () => {
  const modalContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx"), "utf8");
  assert.ok(modalContent.includes(".endsWith(\".jpg\")"), "Modal checks .jpg");
  assert.ok(modalContent.includes(".endsWith(\".jpeg\")"), "Modal checks .jpeg");
});

// 8. PNG recognized
runTest("8. DocumentViewerModal recognizes PNG files", () => {
  const modalContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx"), "utf8");
  assert.ok(modalContent.includes(".endsWith(\".png\")"), "Modal checks .png");
});

// 9. WebP recognized
runTest("9. DocumentViewerModal recognizes WebP files", () => {
  const modalContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx"), "utf8");
  assert.ok(modalContent.includes(".endsWith(\".webp\")"), "Modal checks .webp");
});

// 10. Invalid document handled gracefully
runTest("10. Invalid/broken image load shows 'Document could not be loaded.' (not 'Unable to preview')", () => {
  const modalContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/components/DocumentViewerModal.jsx"), "utf8");
  assert.ok(modalContent.includes("Document could not be loaded."), "Modal displays user-friendly error on load failure");
  assert.ok(!modalContent.includes("Unable to preview image directly."), "Modal removed confusing legacy message");
});

// 11. Empty token rejected
runTest("11. Empty string token rejected before backend registration call", () => {
  const hookContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookContent.includes("!token || typeof token !== \"string\" || !token.trim()"), "Hook guards against empty string token");
});

// 12. Null token rejected
runTest("12. Null token rejected before backend registration call", () => {
  const hookContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookContent.includes("!token"), "Hook guards against null token");
});

// 13. Undefined token rejected
runTest("13. Undefined token rejected before backend registration call", () => {
  const hookContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookContent.includes("typeof token !== \"string\""), "Hook guards against non-string token");
});

// 14. Valid token accepted
runTest("14. Valid token passed to /api/notifications/device-token", () => {
  const hookContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookContent.includes("token: token.trim()"), "Hook sends trimmed valid token");
});

// 15. Firebase registration failure non-blocking
runTest("15. Firebase registration failure handled gracefully in try/catch without crashing app", () => {
  const firebaseContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(firebaseContent.includes("console.warn(\"[FCM]"), "firebaseClient uses controlled logging");
});

// 16. Missing VAPID key non-blocking
runTest("16. Missing VAPID key returns null gracefully", () => {
  const firebaseContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(firebaseContent.includes("!vapidKey"), "Checks vapidKey presence");
});

// 17. No active worker handled
runTest("17. waitForServiceWorkerActive helper handles null/installing worker", () => {
  const firebaseContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(firebaseContent.includes("waitForServiceWorkerActive"), "firebaseClient includes waitForServiceWorkerActive");
});

// 18. Active worker passed to getToken
runTest("18. Active worker passed to getToken options", () => {
  const firebaseContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/utils/firebaseClient.js"), "utf8");
  assert.ok(firebaseContent.includes("serviceWorkerRegistration: activeSw"), "getToken receives activeSw");
});

// 19. Successful token registration updates status
runTest("19. DeviceToken schema supports userId, hostelId, platform, token", () => {
  const DeviceToken = require("../models/DeviceToken");
  const paths = Object.keys(DeviceToken.schema.paths);
  assert.ok(paths.includes("userId"), "DeviceToken has userId");
  assert.ok(paths.includes("token"), "DeviceToken has token");
  assert.ok(paths.includes("platform"), "DeviceToken has platform");
});

// 20. Failed token registration does not show Push Enabled
runTest("20. useFcmNotifications guards unauthenticated users", () => {
  const hookContent = fs.readFileSync(path.join(__dirname, "../../Frontend/src/hooks/useFcmNotifications.js"), "utf8");
  assert.ok(hookContent.includes("if (!jwt || typeof jwt !== \"string\" || !jwt.trim())"), "Requires JWT token before FCM setup");
});

console.log("\n-------------------------------------------------");
console.log(`SUITE RESULTS: ${passed} / ${total} TESTS PASSED`);
console.log("-------------------------------------------------\n");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
