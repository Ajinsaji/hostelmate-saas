const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const { compileTemplate, dispatchWhatsAppMessage, TEMPLATES } = require("../services/whatsappService");
const Communication = require("../models/Communication");
const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");

async function runTest() {
  console.log("\n=======================================================");
  console.log("TEST 1: OWNER ACTIVATION MESSAGE & CREDENTIAL SECURITY");
  console.log("=======================================================\n");

  const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hostelmate";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Template compilation test with tempPassword & expiryDate
    const templateData = {
      ownerName: "Rahul Sharma",
      hostelName: "Royal Star Living",
      username: "9876543210",
      tempPassword: "HM9988@A99",
      planType: "HostelMate Unified Plan",
      expiryDate: "16 September 2026",
      loginUrl: "https://hostelmate-saas.vercel.app/owner/login",
    };

    const compiled = compileTemplate("OWNER_ACCOUNT_ACTIVATED", templateData);
    assert(compiled.includes("HM9988@A99"), "Compiled message contains the live temporary password");
    assert(compiled.includes("16 September 2026"), "Compiled message contains the formatted expiry date");
    assert(compiled.includes("HostelMate Unified Plan"), "Compiled message mentions HostelMate Unified Plan");
    assert(compiled.includes("30 Days Free"), "Compiled message mentions 30 Days Free trial");
    assert(!compiled.includes("{{"), "No unresolved template placeholders {{...}} remain in compiled message");

    // 2. Strict template compilation error test on missing variables
    let failedMissing = false;
    try {
      compileTemplate("OWNER_ACCOUNT_ACTIVATED", {
        ownerName: "Rahul Sharma",
        // missing tempPassword and expiryDate
      });
    } catch (err) {
      failedMissing = true;
    }
    assert(failedMissing, "Template compilation strictly throws error if placeholders cannot be resolved");

    // 3. Dispatch and Security boundary check (MongoDB sanitization)
    const testOwnerId = new mongoose.Types.ObjectId();
    const testHostelId = new mongoose.Types.ObjectId();
    const refId = `TEST_ACT_${Date.now()}`;

    const dispatchResult = await dispatchWhatsAppMessage({
      hostelId: testHostelId,
      ownerId: testOwnerId,
      recipientPhone: "9876543210",
      recipientName: "Rahul Sharma",
      recipientType: "Owner",
      templateCode: "OWNER_ACCOUNT_ACTIVATED",
      variables: {
        ownerName: "Rahul Sharma",
        hostelName: "Royal Star Living",
        username: "9876543210",
        tempPassword: "HM9988@A99",
        planType: "HostelMate Unified Plan",
        expiryDate: "16 September 2026",
        loginUrl: "https://hostelmate-saas.vercel.app/owner/login",
      },
      businessEvent: "OWNER_ACCOUNT_ACTIVATED",
      referenceId: refId,
    });

    // Check live return object contains waMeUrl with the password for authorized admin
    assert(dispatchResult?.waMeUrl?.includes("HM9988%40A99") || dispatchResult?.waMeUrl?.includes("HM9988@A99"), "Returned live object has unredacted waMeUrl for admin interaction");

    // Check stored MongoDB Communication record is redacted
    const commInDb = await Communication.findOne({ referenceId: refId });
    assert(commInDb !== null, "Communication record saved to MongoDB");
    assert(commInDb.message.includes("[Controlled Activation Credential]"), "Stored MongoDB message body redacts the plaintext password");
    assert(!commInDb.message.includes("HM9988@A99"), "Plaintext temporary password is NOT saved anywhere in MongoDB message text");

    const savedVars = commInDb.metadata?.variables || commInDb.variables;
    assert(savedVars?.tempPassword === "[Controlled Activation Credential]", "Stored metadata variables sanitize tempPassword");

    // Cleanup test record
    await Communication.deleteOne({ referenceId: refId });
  } catch (err) {
    console.error("Test execution failed with error:", err);
    failed++;
  } finally {
    console.log(`\nResults: ${passed} Passed, ${failed} Failed\n`);
    if (process.env.TEST_STANDALONE !== "false") {
      await mongoose.disconnect();
      process.exit(failed > 0 ? 1 : 0);
    }
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;
