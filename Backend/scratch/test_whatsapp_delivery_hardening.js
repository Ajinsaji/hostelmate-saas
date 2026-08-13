/**
 * HOSTELMATE ENTERPRISE — META WHATSAPP 401 DELIVERY HARDENING TEST SUITE
 *
 * Verifies all 15 security and delivery requirements:
 * 1. Missing WhatsApp token
 * 2. Missing phone number ID
 * 3. Placeholder configuration
 * 4. Meta 401 (Mapped to App 502, deliveryStatus: "failed")
 * 5. Meta 403 (Mapped to App 502, deliveryStatus: "failed")
 * 6. Meta 400 (Mapped to App 502, deliveryStatus: "failed")
 * 7. Meta 429 (Mapped to App 502, deliveryStatus: "failed")
 * 8. Meta 5xx (Mapped to App 502, deliveryStatus: "failed")
 * 9. Successful delivery (deliveryStatus: "sent")
 * 10. Failed delivery never becomes "sent"
 * 11. No access token appears in API response
 * 12. No JWT appears in logs
 * 13. No temporary password appears in logs
 * 14. Unconfigured response is truthful
 * 15. Admin diagnostics & testing endpoint behavior
 */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const axios = require("axios");

const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");

const {
  sendCredentials,
  getWhatsAppDiagnostics,
  testWhatsAppConfig,
} = require("../controllers/adminController");
const { logger } = require("../utils/logger");

async function runWhatsAppHardeningSuite() {
  console.log("==================================================");
  console.log("🟢 HOSTELMATE — META WHATSAPP DELIVERY HARDENING SUITE");
  console.log("==================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log(" Connected to MongoDB:", mongoUri);

  const ts = Date.now();
  const testPhone = `98765${String(ts).slice(-5)}`;
  const testEmail = `whatsapp-hardening-${ts}@example.test`;
  const testHostelName = `WA_HARDENING_HOSTEL_${ts}`;

  let createdHostel = null;
  let createdOwner = null;

  // Intercept logger to check secret leaks
  const loggedMessages = [];
  const origInfo = logger.info;
  const origError = logger.error;
  const origWarn = logger.warn;

  logger.info = (...args) => {
    loggedMessages.push(JSON.stringify(args));
    origInfo.apply(logger, args);
  };
  logger.error = (...args) => {
    loggedMessages.push(JSON.stringify(args));
    origError.apply(logger, args);
  };
  logger.warn = (...args) => {
    loggedMessages.push(JSON.stringify(args));
    origWarn.apply(logger, args);
  };

  // Mock res factory
  const makeMockRes = () => {
    const res = {};
    res.statusCode = 200;
    res.body = null;
    res.status = function (code) {
      this.statusCode = code;
      return this;
    };
    res.json = function (payload) {
      this.body = payload;
      return this;
    };
    return res;
  };

  // Backup original env & axios methods
  const origEnvToken = process.env.WHATSAPP_TOKEN;
  const origEnvPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const origAxiosPost = axios.post;
  const origAxiosGet = axios.get;

  const sampleSecretToken = "EAAG_TEST_SECRET_ACCESS_TOKEN_DO_NOT_EXPOSE_123456";

  try {
    // Setup test Hostel & Owner
    createdHostel = await Hostel.create({
      hostelName: testHostelName,
      ownerName: `WA Owner ${ts}`,
      phone: testPhone,
      email: testEmail,
      pendingActivation: false,
      subscriptionStatus: "active",
      planType: "Pro",
    });

    createdOwner = await Owner.create({
      hostelId: createdHostel._id,
      ownerName: `WA Owner ${ts}`,
      phone: testPhone,
      email: testEmail,
      password: "$2a$10$abcdefghijklmnopqrstuvwxyz12345678901234567890123456",
      role: "owner",
      status: "active",
      credentialDeliveryStatus: "not_issued",
    });

    console.log(` Created test owner ID: ${createdOwner._id}\n`);

    // ----------------------------------------------------
    // TEST 1: Missing WhatsApp token
    // ----------------------------------------------------
    console.log("[TEST 1/15] Verifying missing WhatsApp token...");
    process.env.WHATSAPP_TOKEN = "";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "1234567890";

    let mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.unconfigured === true &&
      mockRes.body?.deliveryStatus === "unconfigured"
    ) {
      console.log("✓ PASS [1/15] Missing token returns controlled 200 unconfigured response");
    } else {
      throw new Error(`Test 1 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 2: Missing phone number ID
    // ----------------------------------------------------
    console.log("\n[TEST 2/15] Verifying missing Phone Number ID...");
    process.env.WHATSAPP_TOKEN = sampleSecretToken;
    process.env.WHATSAPP_PHONE_NUMBER_ID = "";

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.unconfigured === true &&
      mockRes.body?.deliveryStatus === "unconfigured"
    ) {
      console.log("✓ PASS [2/15] Missing phone number ID returns controlled 200 unconfigured response");
    } else {
      throw new Error(`Test 2 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 3: Placeholder configuration
    // ----------------------------------------------------
    console.log("\n[TEST 3/15] Verifying placeholder configuration detection...");
    process.env.WHATSAPP_TOKEN = "your_whatsapp_token_here";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "dummy_phone_id";

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.unconfigured === true &&
      mockRes.body?.deliveryStatus === "unconfigured"
    ) {
      console.log("✓ PASS [3/15] Placeholder credentials recognized as unconfigured");
    } else {
      throw new Error(`Test 3 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // Set valid configuration for real request mocks
    process.env.WHATSAPP_TOKEN = sampleSecretToken;
    process.env.WHATSAPP_PHONE_NUMBER_ID = "987654321012345";

    // ----------------------------------------------------
    // TEST 4: Meta 401 Unauthorized (Must return App 502 Bad Gateway, NOT 401!)
    // ----------------------------------------------------
    console.log("\n[TEST 4/15] Verifying Meta 401 Unauthorized handling...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 401");
      err.response = {
        status: 401,
        data: { error: { message: "Invalid OAuth access token", code: 190 } },
      };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.deliveryStatus === "failed" &&
      mockRes.body?.errorType === "META_AUTHENTICATION" &&
      mockRes.body?.message === "WhatsApp authentication failed. Please verify the Meta access token and WhatsApp Business configuration."
    ) {
      console.log("✓ PASS [4/15] Meta 401 translated to application 502 with safe error message");
    } else {
      throw new Error(`Test 4 failed: Expected HTTP 502 & META_AUTHENTICATION, got: ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 5: Meta 403 Permission Denied
    // ----------------------------------------------------
    console.log("\n[TEST 5/15] Verifying Meta 403 Permission Denied handling...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 403");
      err.response = {
        status: 403,
        data: { error: { message: "Permission denied for endpoint", code: 200 } },
      };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.deliveryStatus === "failed" &&
      mockRes.body?.errorType === "META_PERMISSION" &&
      mockRes.body?.message.includes("permission denied")
    ) {
      console.log("✓ PASS [5/15] Meta 403 translated to application 502 with safe permission error message");
    } else {
      throw new Error(`Test 5 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 6: Meta 400 Rejected Request
    // ----------------------------------------------------
    console.log("\n[TEST 6/15] Verifying Meta 400 Bad Request handling...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 400");
      err.response = {
        status: 400,
        data: { error: { message: "Invalid payload or parameter", code: 100 } },
      };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.deliveryStatus === "failed" &&
      mockRes.body?.errorType === "META_REJECTED"
    ) {
      console.log("✓ PASS [6/15] Meta 400 translated to application 502 META_REJECTED error");
    } else {
      throw new Error(`Test 6 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 7: Meta 429 Rate Limit
    // ----------------------------------------------------
    console.log("\n[TEST 7/15] Verifying Meta 429 Rate Limit handling...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 429");
      err.response = {
        status: 429,
        data: { error: { message: "User rate limit exceeded", code: 4 } },
      };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.deliveryStatus === "failed" &&
      mockRes.body?.errorType === "META_RATE_LIMIT"
    ) {
      console.log("✓ PASS [7/15] Meta 429 translated to application 502 META_RATE_LIMIT error");
    } else {
      throw new Error(`Test 7 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 8: Meta 5xx Upstream Unavailable
    // ----------------------------------------------------
    console.log("\n[TEST 8/15] Verifying Meta 503 Service Unavailable handling...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 503");
      err.response = {
        status: 503,
        data: { error: { message: "Service temporarily unavailable", code: 2 } },
      };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.deliveryStatus === "failed" &&
      mockRes.body?.errorType === "META_UNAVAILABLE"
    ) {
      console.log("✓ PASS [8/15] Meta 503 translated to application 502 META_UNAVAILABLE error");
    } else {
      throw new Error(`Test 8 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 9: Successful Delivery
    // ----------------------------------------------------
    console.log("\n[TEST 9/15] Verifying Successful WhatsApp delivery...");
    axios.post = async () => {
      return {
        data: {
          messaging_product: "whatsapp",
          contacts: [{ input: testPhone, wa_id: `91${testPhone}` }],
          messages: [{ id: "wamid.HBgLTESTMESSAGEID12345" }],
        },
      };
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.success === true &&
      mockRes.body?.deliveryStatus === "sent"
    ) {
      console.log("✓ PASS [9/15] Successful delivery returned status 'sent'");
    } else {
      throw new Error(`Test 9 failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 10: Failed Delivery Never Becomes "sent"
    // ----------------------------------------------------
    console.log("\n[TEST 10/15] Verifying failed delivery status truthfulness in Database...");
    axios.post = async () => {
      const err = new Error("Request failed with status code 401");
      err.response = { status: 401, data: { error: { message: "Unauthorized" } } };
      throw err;
    };

    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    const ownerAfterFailure = await Owner.findById(createdOwner._id);
    if (
      ownerAfterFailure.credentialDeliveryStatus === "failed" &&
      ownerAfterFailure.lastDeliveryError === "WhatsApp authentication failed. Please verify the Meta access token and WhatsApp Business configuration."
    ) {
      console.log("✓ PASS [10/15] Database truthfully records status 'failed' and exact safe error message");
    } else {
      throw new Error(`Test 10 failed: DB has status ${ownerAfterFailure.credentialDeliveryStatus}, error: ${ownerAfterFailure.lastDeliveryError}`);
    }

    // ----------------------------------------------------
    // TEST 11: No access token appears in API response
    // ----------------------------------------------------
    console.log("\n[TEST 11/15] Verifying access token is NEVER present in API responses...");
    const responseJsonStr = JSON.stringify(mockRes.body);
    if (!responseJsonStr.includes(sampleSecretToken)) {
      console.log("✓ PASS [11/15] Zero access token leakage in API responses");
    } else {
      throw new Error("CRITICAL SECURITY FAILURE: Access token leaked in API response!");
    }

    // ----------------------------------------------------
    // TEST 12: No JWT appears in logs
    // ----------------------------------------------------
    console.log("\n[TEST 12/15] Verifying no JWT tokens appear in logs...");
    const allLogs = loggedMessages.join("\n");
    const jwtRegex = /eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/;
    if (!jwtRegex.test(allLogs)) {
      console.log("✓ PASS [12/15] Zero JWT token leakage in application logs");
    } else {
      throw new Error("CRITICAL SECURITY FAILURE: JWT token leaked in logs!");
    }

    // ----------------------------------------------------
    // TEST 13: No temporary password appears in logs
    // ----------------------------------------------------
    console.log("\n[TEST 13/15] Verifying no temporary passwords appear in logs...");
    if (!allLogs.includes("Temp@1234") && !allLogs.includes("tempPassword: \"")) {
      console.log("✓ PASS [13/15] Zero temporary password leakage in logs");
    } else {
      throw new Error("CRITICAL SECURITY FAILURE: Temporary password leaked in logs!");
    }

    // ----------------------------------------------------
    // TEST 14: Unconfigured response is truthful
    // ----------------------------------------------------
    console.log("\n[TEST 14/15] Verifying truthful unconfigured response structure...");
    process.env.WHATSAPP_TOKEN = "";
    mockRes = makeMockRes();
    await sendCredentials({ params: { ownerId: createdOwner._id } }, mockRes);

    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.success === false &&
      mockRes.body?.unconfigured === true &&
      mockRes.body?.deliveryStatus === "unconfigured"
    ) {
      console.log("✓ PASS [14/15] Unconfigured response structure verified");
    } else {
      throw new Error(`Test 14 failed: Got ${JSON.stringify(mockRes.body)}`);
    }

    // ----------------------------------------------------
    // TEST 15: Admin diagnostics & test endpoints
    // ----------------------------------------------------
    console.log("\n[TEST 15/15] Verifying Admin WhatsApp Diagnostics & Test Endpoints...");
    process.env.WHATSAPP_TOKEN = sampleSecretToken;
    process.env.WHATSAPP_PHONE_NUMBER_ID = "987654321012345";

    // Diagnostic endpoint GET /api/admin/whatsapp/status
    mockRes = makeMockRes();
    await getWhatsAppDiagnostics({}, mockRes);
    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.success === true &&
      mockRes.body?.configured === true &&
      mockRes.body?.phoneNumberIdConfigured === true &&
      mockRes.body?.tokenConfigured === true
    ) {
      console.log("  ✓ Diagnostic endpoint returned sanitized status");
    } else {
      throw new Error(`Test 15a failed: Got ${JSON.stringify(mockRes.body)}`);
    }

    // Test endpoint POST /api/admin/whatsapp/test (Simulate Meta 200 OK)
    axios.get = async () => {
      return { data: { id: "987654321012345", verified_name: "HostelMate" } };
    };

    mockRes = makeMockRes();
    await testWhatsAppConfig({}, mockRes);
    if (
      mockRes.statusCode === 200 &&
      mockRes.body?.success === true &&
      mockRes.body?.verified === true &&
      mockRes.body?.status === "Connected"
    ) {
      console.log("  ✓ Test endpoint verified Meta credentials successfully");
    } else {
      throw new Error(`Test 15b failed: Got ${JSON.stringify(mockRes.body)}`);
    }

    // Test endpoint POST /api/admin/whatsapp/test (Simulate Meta 401 failure)
    axios.get = async () => {
      const err = new Error("Request failed with status code 401");
      err.response = { status: 401, data: { error: { message: "Invalid OAuth access token" } } };
      throw err;
    };

    mockRes = makeMockRes();
    await testWhatsAppConfig({}, mockRes);
    if (
      mockRes.statusCode === 502 &&
      mockRes.body?.success === false &&
      mockRes.body?.status === "Authentication Failed"
    ) {
      console.log("  ✓ Test endpoint returned sanitized 502 Authentication Failed error");
      console.log("✓ PASS [15/15] Admin diagnostics & test endpoints fully functional and safe");
    } else {
      throw new Error(`Test 15c failed: Got ${mockRes.statusCode} ${JSON.stringify(mockRes.body)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL 15 WHATSAPP HARDENING TESTS PASSED!");
    console.log("==================================================\n");

  } finally {
    // Restore env & mocks
    process.env.WHATSAPP_TOKEN = origEnvToken;
    process.env.WHATSAPP_PHONE_NUMBER_ID = origEnvPhoneId;
    axios.post = origAxiosPost;
    axios.get = origAxiosGet;
    logger.info = origInfo;
    logger.error = origError;
    logger.warn = origWarn;

    // Cleanup DB
    if (createdOwner) await Owner.deleteOne({ _id: createdOwner._id });
    if (createdHostel) await Hostel.deleteOne({ _id: createdHostel._id });
    await mongoose.disconnect();
    console.log(" Disconnected from MongoDB.");
  }
}

runWhatsAppHardeningSuite().catch((err) => {
  console.error("\n❌ TEST SUITE FAILED:", err);
  process.exit(1);
});
