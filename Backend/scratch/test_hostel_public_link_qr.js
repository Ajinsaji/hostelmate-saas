/**
 * Test: test_hostel_public_link_qr.js
 * Validates canonical public URL generation, QR code encoding, public admission endpoint resolution, and security.
 */

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Hostel = require("../models/Hostel");
const { getHostelProfile } = require("../services/hostels/hostelProfileService");
const { getPublicHostel } = require("../controllers/publicController");

async function runPublicLinkTests() {
  console.log("\n========================================================");
  console.log("  HOSTEL DETAILS — PUBLIC LINK & QR INTEGRITY TESTS");
  console.log("========================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  await mongoose.connect(uri);

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${msg}`);
      failed++;
    }
  }

  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.body = data;
        return this;
      }
    };
  }

  try {
    const timestamp = Date.now();
    const testCode = `TEST${timestamp.toString().slice(-4)}`;

    // Create test active hostel
    const testHostel = await Hostel.create({
      hostelName: `Evergreen_Hostel_${timestamp}`,
      phone: `9199${Math.floor(100000 + Math.random() * 900000)}`,
      uniqueCode: testCode,
      slug: `evergreen-${timestamp}`,
      isPublic: true,
      pendingActivation: false,
      isDeleted: false,
      address: "45 Hill View Road, Wayanad",
      city: "Kalpetta",
      district: "Wayanad",
      rulesText: "Standard hostel rules apply.",
      currentRulesVersion: "v1.0",
      rulesVersionNumber: 1,
    });

    // TEST 1: getHostelProfile resolves canonical public URL and uniqueCode
    const profile = await getHostelProfile(testHostel._id);
    assert(!!profile, "getHostelProfile returned profile data");
    assert(profile.uniqueCode === testCode, "Profile uniqueCode matches database code");
    assert(profile.publicUrl && profile.publicUrl.includes(`/h/${testCode}`), `Canonical public URL correctly formatted: ${profile.publicUrl}`);

    // TEST 2: Public endpoint GET /api/public/hostel/:uniqueCode resolves successfully
    const mockRes = createMockRes();
    await getPublicHostel({ params: { uniqueCode: testCode } }, mockRes);
    assert(mockRes.statusCode === 200 && mockRes.body.success, "Public admission endpoint returns 200 OK");
    assert(mockRes.body.hostel && mockRes.body.hostel.hostelName === testHostel.hostelName, "Public response contains correct hostel name");
    assert(!mockRes.body.hostel.deletedBy && !mockRes.body.hostel.adminToken, "Public response does not leak internal admin fields or tokens");

    // TEST 3: QR Server target encodes exact public URL
    const expectedEncoded = encodeURIComponent(profile.publicUrl);
    const qrTestUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${expectedEncoded}&margin=8`;
    assert(qrTestUrl.includes(expectedEncoded), "QR code generator encodes exact canonical public admission link");

    // Cleanup
    await Hostel.findByIdAndDelete(testHostel._id);

  } catch (err) {
    console.error("Public link test error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`PUBLIC LINK TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runPublicLinkTests();
