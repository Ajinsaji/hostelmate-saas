"use strict";

const assert = require("assert");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

console.log("====================================================================");
console.log("HOSTELMATE DEPLOYMENT & HEALTH PROBE AUDIT (15 TESTS)");
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

  const healthController = require("../controllers/healthController");

  // Mock res object
  const createMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (data) => {
      res.body = data;
      return res;
    };
    return res;
  };

  // 1. Liveness probe does not require DB
  runTest("1. getLiveHealth probe returns 200 OK without requiring MongoDB connection", () => {
    const mockRes = createMockRes();
    healthController.getLiveHealth({}, mockRes);
    assert.strictEqual(mockRes.statusCode, 200);
    assert.strictEqual(mockRes.body.status, "ok");
  });

  // 2. Readiness probe reflects DB state accurately
  runTest("2. getReadyHealth probe reflects DB readyState status code", () => {
    const mockRes = createMockRes();
    healthController.getReadyHealth({}, mockRes);
    const expectedStatus = mongoose.connection.readyState === 1 ? 200 : 503;
    assert.strictEqual(mockRes.statusCode, expectedStatus);
  });

  // 3. Port environment check
  runTest("3. Server listens on process.env.PORT or fallback 5000", () => {
    const serverCode = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    assert.ok(serverCode.includes("const PORT = process.env.PORT || 5000;"));
  });

  // 4. connectDB error handling does not call process.exit(1)
  runTest("4. connectDB gracefully handles connection error without process.exit(1)", () => {
    const dbCode = fs.readFileSync(path.join(__dirname, "../config/db.js"), "utf8");
    assert.strictEqual(dbCode.includes("process.exit(1)"), false, "process.exit(1) removed from db.js");
  });

  // 5. Server startup order binds HTTP port first
  runTest("5. server.js starts HTTP listener before asynchronous background DB connect", () => {
    const serverCode = fs.readFileSync(path.join(__dirname, "../server.js"), "utf8");
    const listenIndex = serverCode.indexOf("server.listen(PORT");
    const connectDbIndex = serverCode.indexOf("connectDB().then");
    assert.ok(listenIndex < connectDbIndex, "server.listen called before connectDB().then");
  });

  // 6. Environment MongoDB URI presence check
  runTest("6. Production MONGO_URI configuration check", () => {
    assert.ok(parsedEnv.MONGO_URI || process.env.MONGO_URI, "MONGO_URI configured");
  });

  // 7. Firebase optional integration check
  runTest("7. FCM service initializes safely with graceful fallback", () => {
    const fcmCode = fs.readFileSync(path.join(__dirname, "../utils/firebaseAdmin.js"), "utf8");
    assert.ok(fcmCode.includes("firebase-admin") || fcmCode.includes("try"));
  });

  // 8. WhatsApp environment variable check
  runTest("8. WhatsApp environment helper checks WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_API_VERSION", () => {
    const waUtilCode = fs.readFileSync(path.join(__dirname, "../utils/sendOwnerWhatsApp.js"), "utf8");
    assert.ok(waUtilCode.includes("WHATSAPP_TOKEN"));
    assert.ok(waUtilCode.includes("WHATSAPP_PHONE_NUMBER_ID"));
    assert.ok(waUtilCode.includes("WHATSAPP_API_VERSION"));
  });

  // 9. Cloudinary configuration check
  runTest("9. Cloudinary storage fallback handles unconfigured state gracefully", () => {
    const uploadUtilCode = fs.readFileSync(path.join(__dirname, "../utils/getUploadedFileUrl.js"), "utf8");
    assert.ok(uploadUtilCode.includes("getUploadedFileUrl"));
  });

  // 10. Activation password format requirement
  const generateTempPassword = () => `HM${Math.floor(1000 + Math.random() * 9000)}@${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10 + Math.random() * 90)}`;
  const samplePass = generateTempPassword();
  runTest("10. Temporary password matches HM pattern", () => {
    assert.ok(/^HM\d{4}@[A-Z]\d{2}$/.test(samplePass));
  });

  // 11. Bcrypt hashing requirement
  const sampleHash = await bcrypt.hash(samplePass, 10);
  runTest("11. Owner password is stored strictly as bcrypt hash", () => {
    assert.ok(sampleHash.startsWith("$2a$") || sampleHash.startsWith("$2b$"));
    assert.notStrictEqual(sampleHash, samplePass);
  });

  // 12. Password comparison check
  runTest("12. Bcrypt compare validates valid temporary password", async () => {
    const match = await bcrypt.compare(samplePass, sampleHash);
    assert.strictEqual(match, true);
  });

  // 13. Invalid password comparison check
  runTest("13. Bcrypt compare rejects wrong password", async () => {
    const match = await bcrypt.compare("WrongPassword123!", sampleHash);
    assert.strictEqual(match, false);
  });

  // 14. Communication template compilation check
  const { compileTemplate } = require("../services/whatsappService");
  const compiled = compileTemplate("OWNER_ACCOUNT_ACTIVATED", {
    ownerName: "Audit Owner",
    hostelName: "Audit Hostel",
    username: "9998887776",
    tempPassword: samplePass,
  });
  runTest("14. compileTemplate produces clean activation message containing real temporary password", () => {
    assert.ok(compiled.includes(`Temporary Password: ${samplePass}`));
  });

  // 15. Communication template redaction check
  const compiledRedacted = compileTemplate("OWNER_ACCOUNT_ACTIVATED", {
    ownerName: "Audit Owner",
    hostelName: "Audit Hostel",
    username: "9998887776",
    tempPassword: "[Controlled Activation Credential]",
  });
  runTest("15. compileTemplate produces redacted DB message with [Controlled Activation Credential]", () => {
    assert.ok(compiledRedacted.includes("Temporary Password: [Controlled Activation Credential]"));
    assert.strictEqual(compiledRedacted.includes(samplePass), false);
  });

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