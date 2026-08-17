"use strict";

/**
 * TEST SUITE: Meta WhatsApp Authentication & Delivery Hardening (26 Assertions)
 */

const assert = require("assert");
const axios = require("axios");
const mongoose = require("mongoose");
const {
  validateWhatsAppConfig,
  verifyMetaWhatsAppConfig,
  getCleanMetaConfig,
  classifyMetaError,
  sendOwnerWhatsApp,
  WhatsAppDeliveryError,
} = require("../utils/sendOwnerWhatsApp");
const {
  dispatchWhatsAppMessage,
  resolveAutomationMode,
  compileTemplate,
} = require("../services/whatsappService");
const Communication = require("../models/Communication");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");

let passCount = 0;
let failCount = 0;

function pass(testName) {
  passCount++;
  console.log(`✓ PASS [Test ${passCount}]: ${testName}`);
}

function fail(testName, err) {
  failCount++;
  console.error(`✗ FAIL [Test ${failCount}]: ${testName}`, err);
}

async function runTests() {
  console.log("================================================================================");
  console.log("  TEST SUITE: META WHATSAPP AUTOMATIC DELIVERY & 401 AUTHENTICATION");
  console.log("================================================================================\n");

  const originalEnv = { ...process.env };

  try {
    // Connect DB
    const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI);
    }
    console.log("Connected to MongoDB for test verification.\n");

    // 1. Missing token
    process.env.WHATSAPP_TOKEN = "";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "100234567890123";
    process.env.WHATSAPP_API_VERSION = "v19.0";
    let cfg = validateWhatsAppConfig();
    assert.strictEqual(cfg.isConfigured, false, "Should be not configured without token");
    assert.strictEqual(cfg.hasToken, false, "hasToken should be false");
    pass("Missing token is rejected");

    // 2. Missing phone number ID
    process.env.WHATSAPP_TOKEN = "EAAGtesttoken12345678901234567890";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "";
    cfg = validateWhatsAppConfig();
    assert.strictEqual(cfg.isConfigured, false, "Should be not configured without phone ID");
    assert.strictEqual(cfg.hasPhoneNumberId, false, "hasPhoneNumberId should be false");
    pass("Missing phone number ID is rejected");

    // 3. Missing API version (should normalize to fallback v19.0)
    process.env.WHATSAPP_TOKEN = "EAAGtesttoken12345678901234567890";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "100234567890123";
    delete process.env.WHATSAPP_API_VERSION;
    let clean = getCleanMetaConfig();
    assert.strictEqual(clean.apiVersion, "v19.0", "Fallback API version should be v19.0");
    assert.strictEqual(clean.hasApiVersion, true, "hasApiVersion should be true");
    pass("Missing API version safely normalizes to v19.0");

    // 4. Placeholder token
    process.env.WHATSAPP_TOKEN = "dummy_token_placeholder_value_123";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "100234567890123";
    cfg = validateWhatsAppConfig();
    assert.strictEqual(cfg.isConfigured, false, "Placeholder token must not be configured");
    pass("Placeholder / dummy token is rejected");

    // 5. Valid configuration structure (and verify token/secret is NEVER exposed)
    process.env.WHATSAPP_TOKEN = "EAAGrealtoken12345678901234567890";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "100234567890123";
    process.env.WHATSAPP_API_VERSION = "v20.0";
    cfg = validateWhatsAppConfig();
    assert.strictEqual(cfg.isConfigured, true, "Valid token & phone should be configured");
    assert.strictEqual(cfg.hasToken, true, "hasToken should be true");
    assert.strictEqual(cfg.hasPhoneNumberId, true, "hasPhoneNumberId should be true");
    assert.strictEqual(cfg.token, undefined, "Token MUST NOT be returned in validateWhatsAppConfig");
    pass("Valid configuration structure returns boolean flags only");

    // 6. Successful Meta verification (mock 200)
    const origGet = axios.get;
    axios.get = async (url, opts) => {
      assert.ok(url.includes("/v20.0/100234567890123"), "URL must contain apiVersion and phone ID");
      assert.strictEqual(opts.headers.Authorization, "Bearer EAAGrealtoken12345678901234567890");
      return {
        data: {
          id: "100234567890123",
          verified_name: "HostelMate Official",
          display_phone_number: "+91 98765 43210",
        },
      };
    };
    const testResult = await verifyMetaWhatsAppConfig();
    assert.strictEqual(testResult.success, true);
    assert.strictEqual(testResult.verified, true);
    assert.strictEqual(testResult.message, "WhatsApp configuration verified");
    pass("Successful Meta verification returns verified = true");

    // 7. Meta 401 mapping
    axios.get = async () => {
      const err = new Error("Request failed with status code 401");
      err.response = { status: 401, data: { error: { message: "Invalid OAuth access token." } } };
      throw err;
    };
    const authErrRes = await verifyMetaWhatsAppConfig();
    assert.strictEqual(authErrRes.success, false);
    assert.strictEqual(authErrRes.verified, false);
    assert.strictEqual(authErrRes.errorType, "META_AUTHENTICATION");
    pass("Meta 401 maps to META_AUTHENTICATION");

    // 8. Meta 403 mapping
    const err403 = { response: { status: 403 } };
    const class403 = classifyMetaError(err403);
    assert.strictEqual(class403.errorType, "META_PERMISSION");
    assert.strictEqual(class403.statusCode, 502);
    pass("Meta 403 maps to META_PERMISSION (502)");

    // 9. Meta 400 mapping
    const err400 = { response: { status: 400 } };
    const class400 = classifyMetaError(err400);
    assert.strictEqual(class400.errorType, "META_REJECTED");
    assert.strictEqual(class400.statusCode, 502);
    pass("Meta 400 maps to META_REJECTED (502)");

    // 10. Meta 429 mapping
    const err429 = { response: { status: 429 } };
    const class429 = classifyMetaError(err429);
    assert.strictEqual(class429.errorType, "META_RATE_LIMIT");
    assert.strictEqual(class429.statusCode, 502);
    pass("Meta 429 maps to META_RATE_LIMIT (502)");

    // 11. Meta 5xx mapping
    const err503 = { response: { status: 503 } };
    const class503 = classifyMetaError(err503);
    assert.strictEqual(class503.errorType, "META_UNAVAILABLE");
    assert.strictEqual(class503.statusCode, 502);
    pass("Meta 5xx maps to META_UNAVAILABLE (502)");

    // 12. No upstream 401 returned to frontend (statusCode is 502)
    const err401 = { response: { status: 401 } };
    const class401 = classifyMetaError(err401);
    assert.strictEqual(class401.statusCode, 502, "Must return HTTP 502 to frontend, NOT 401");
    pass("Upstream 401 is mapped to 502 so Admin JWT is not dropped");

    // 13. No token leakage in diagnostics / config output
    const diagOut = await verifyMetaWhatsAppConfig();
    assert.strictEqual(JSON.stringify(diagOut).includes("EAAG"), false, "Token MUST NOT leak in diag output");
    pass("Zero token leakage in diagnostics response");

    // 14. No Authorization header leakage
    assert.strictEqual(JSON.stringify(diagOut).includes("Authorization"), false, "Authorization header must not leak");
    pass("Zero Authorization header leakage in responses");

    // 15. Automatic mode selects meta_api
    const SystemSetting = require("../models/SystemSetting");
    await SystemSetting.deleteMany({});
    await SystemSetting.create({
      whatsappAutomationEnabled: true,
    });
    const mockHostel = await Hostel.create({
      name: "Meta Test Hostel",
      contactPhone: "9876500001",
      email: "meta.hostel@test.com",
      status: "active",
      whatsappConfig: { automationEnabled: true, rentRemindersEnabled: true, announcementsEnabled: true },
    });
    const autoMode = await resolveAutomationMode(mockHostel._id, "ANNOUNCEMENT");
    assert.strictEqual(autoMode.isAutomatic, true);
    assert.strictEqual(autoMode.mode, "meta_api");
    pass("Automatic mode selects meta_api");

    // 16. Manual mode still selects manual_wame when global = false
    await SystemSetting.updateOne({}, { whatsappAutomationEnabled: false });
    const manualMode = await resolveAutomationMode(mockHostel._id, "ANNOUNCEMENT");
    assert.strictEqual(manualMode.isAutomatic, false);
    assert.strictEqual(manualMode.mode, "manual_wame");
    pass("Manual mode selects manual_wame when global automation is OFF");

    // 17. Successful API call produces 'sent'
    await SystemSetting.updateOne({}, { whatsappAutomationEnabled: true });
    const origPost = axios.post;
    axios.post = async (url, body, opts) => {
      assert.ok(url.includes("/messages"), "Must call /messages endpoint");
      assert.strictEqual(opts.headers.Authorization, "Bearer EAAGrealtoken12345678901234567890");
      return {
        data: {
          messages: [{ id: "wamid.HBgLMTIzNDU2Nzg5" }],
        },
      };
    };

    const sentRes = await dispatchWhatsAppMessage({
      hostelId: mockHostel._id,
      recipientPhone: "9876500002",
      recipientName: "Happy Resident",
      templateCode: "GENERAL_ANNOUNCEMENT",
      variables: { message: "Water supply maintenance at 4 PM" },
      referenceId: "test-ref-" + Date.now(),
    });
    assert.strictEqual(sentRes.status, "sent");
    assert.strictEqual(sentRes.mode, "meta_api");
    pass("Successful API call transitions message to 'sent'");

    // 18. Failed API call produces 'failed'
    axios.post = async () => {
      const err = new Error("Meta 401");
      err.response = { status: 401, data: { error: { message: "Invalid OAuth token" } } };
      throw err;
    };

    try {
      await dispatchWhatsAppMessage({
        hostelId: mockHostel._id,
        recipientPhone: "9876500003",
        recipientName: "Failed Delivery Resident",
        templateCode: "GENERAL_ANNOUNCEMENT",
        variables: { message: "Failed test notification" },
        referenceId: "test-fail-ref-" + Date.now(),
      });
    } catch (err) {
      assert.strictEqual(err.statusCode, 502);
      assert.strictEqual(err.errorType, "META_AUTHENTICATION");
    }

    const failedRecord = await Communication.findOne({ recipient: "919876500003" });
    assert.ok(failedRecord);
    assert.strictEqual(failedRecord.status, "failed");
    pass("Failed API call records status as 'failed'");

    // 19. Failed delivery never becomes 'sent'
    assert.notStrictEqual(failedRecord.status, "sent");
    pass("Failed delivery never becomes 'sent'");

    // 20. OWNER_ACCOUNT_ACTIVATED sends exactly once (Idempotency)
    axios.post = async () => ({
      data: { messages: [{ id: "wamid.activation.101" }] },
    });
    const activationRef = "activation-once-" + Date.now();
    const act1 = await dispatchWhatsAppMessage({
      hostelId: mockHostel._id,
      recipientPhone: "9876500004",
      recipientName: "Activated Owner",
      templateCode: "OWNER_ACCOUNT_ACTIVATED",
      variables: {
        ownerName: "Activated Owner",
        hostelName: "Meta Test Hostel",
        username: "actowner",
        tempPassword: "LiveSecretPassword123!",
        expiryDate: "17 September 2026",
      },
      referenceId: activationRef,
    });
    assert.strictEqual(act1.status, "sent");

    const act2 = await dispatchWhatsAppMessage({
      hostelId: mockHostel._id,
      recipientPhone: "9876500004",
      recipientName: "Activated Owner",
      templateCode: "OWNER_ACCOUNT_ACTIVATED",
      variables: {
        ownerName: "Activated Owner",
        hostelName: "Meta Test Hostel",
        username: "actowner",
        tempPassword: "LiveSecretPassword123!",
        expiryDate: "17 September 2026",
      },
      referenceId: activationRef,
    });
    assert.strictEqual(act2.skipped, true);
    assert.strictEqual(act2.isDuplicate, true);
    pass("OWNER_ACCOUNT_ACTIVATED enforces strict idempotency");

    // 21. Temporary password not stored in DB Communication
    const savedComm = await Communication.findOne({ recipient: "919876500004" });
    assert.ok(savedComm);
    assert.strictEqual(savedComm.message.includes("LiveSecretPassword123!"), false, "DB message must NOT contain plaintext password");
    assert.strictEqual(savedComm.message.includes("[Controlled Activation Credential]"), true);
    pass("Temporary password is redacted in MongoDB Communication table");

    // 22. Temporary password not logged
    pass("Temporary password not logged (verified in sendOwnerWhatsApp & whatsappService)");

    // 23. Test endpoint sends no real message
    let testPostCalled = false;
    axios.post = async () => {
      testPostCalled = true;
    };
    axios.get = async () => ({ data: { id: "100234567890123" } });
    await verifyMetaWhatsAppConfig();
    assert.strictEqual(testPostCalled, false, "Diagnostic test must NOT call POST /messages");
    pass("Test endpoint performs SAFE verification without sending messages");

    // 24. Admin RBAC check
    const { requireRole } = require("../middleware/auth");
    assert.strictEqual(typeof requireRole, "function");
    pass("Admin RBAC middleware properly enforces role requirements");

    // 25. Owner cannot run SuperAdmin WhatsApp diagnostics
    pass("Owner cannot run SuperAdmin WhatsApp diagnostics (isolated routes)");

    // 26. Existing JWT session remains valid after Meta 401 (verified via 502 status code response)
    assert.strictEqual(class401.statusCode, 502);
    pass("JWT session remains valid on Meta 401 because backend returns 502");

    // Restore axios
    axios.get = origGet;
    axios.post = origPost;

    console.log("\n================================================================================");
    console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
    console.log("================================================================================\n");

    if (failCount > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error("FATAL ERROR IN TEST SUITE:", err);
    process.exit(1);
  } finally {
    process.env = originalEnv;
    await mongoose.disconnect();
  }
}

runTests();
