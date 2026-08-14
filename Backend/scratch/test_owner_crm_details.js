/**
 * Test: test_owner_crm_details.js
 * Validates real owner profile data, masked Aadhaar/identity, linked hostel metrics,
 * status updates with session revocation, and secure temporary password reset.
 */

const mongoose = require("mongoose");
const path = require("path");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const HostelRequest = require("../models/HostelRequest");
const Subscription = require("../models/Subscription");
const Resident = require("../models/Resident");
const Room = require("../models/Room");
const OwnerSession = require("../models/OwnerSession");
const { getAllOwnersList, setOwnerStatus, resetOwnerTempPassword } = require("../controllers/adminController");

async function runOwnerCRMTests() {
  console.log("\n========================================================");
  console.log("  OWNERS CRM — DETAILS, STATUS & PASSWORD RESET TESTS");
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
    const testPhone = `9811${Math.floor(100000 + Math.random() * 900000)}`;

    // Create linked Hostel
    const testHostel = await Hostel.create({
      hostelName: `Royal_Palace_${timestamp}`,
      phone: testPhone,
      address: "123 MG Road, Ernakulam",
      city: "Kochi",
      district: "Ernakulam",
      state: "Kerala",
      pincode: "682001",
      planType: "Pro",
      subscriptionStatus: "active",
      pendingActivation: false,
      isDeleted: false,
      uniqueCode: `ROYAL${timestamp.toString().slice(-4)}`,
    });

    // Create linked Subscription
    const testSub = await Subscription.create({
      hostelId: testHostel._id,
      planType: "Pro",
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    // Create linked Request with Aadhaar
    const testReq = await HostelRequest.create({
      hostelName: testHostel.hostelName,
      ownerName: "Ajin Saji",
      phone: testPhone,
      idType: "Aadhaar",
      idNumber: "123456789012",
      aadhaarFile: "https://example.com/aadhaar.jpg",
      status: "activated",
    });

    // Create test Owner
    const hashedPwd = await bcrypt.hash("Initial@123", 10);
    const testOwner = await Owner.create({
      ownerName: "Ajin Saji",
      phone: testPhone,
      email: `ajin_${timestamp}@example.com`,
      password: hashedPwd,
      hostelId: testHostel._id,
      activeHostelId: testHostel._id,
      profileImage: "https://example.com/ajin-photo.jpg",
      status: "active",
      role: "owner",
    });

    // Create active session
    const testSession = await OwnerSession.create({
      ownerId: testOwner._id,
      sessionId: `sess_${timestamp}`,
      deviceId: `dev_${timestamp}`,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 86400000),
    });

    // TEST 1: getAllOwnersList returns real profile, masked Aadhaar, and linked hostel metrics
    const mockResList = createMockRes();
    await getAllOwnersList({ query: { search: testPhone } }, mockResList);
    assert(mockResList.statusCode === 200 && mockResList.body.success, "getAllOwnersList returns 200 with success");
    
    const owners = mockResList.body.data || [];
    const targetOwner = owners.find(o => o.phone === testPhone);
    assert(!!targetOwner, "Found test owner in CRM list");
    assert(targetOwner.name === "Ajin Saji", "Owner name is populated correctly");
    assert(targetOwner.photo === "https://example.com/ajin-photo.jpg", "Real owner photo populated");
    assert(targetOwner.identity && targetOwner.identity.idNumber === "XXXX XXXX 9012", "Aadhaar number is properly masked (XXXX XXXX 9012)");
    assert(targetOwner.hostelDetails && targetOwner.hostelDetails.hostelName === testHostel.hostelName, "Linked hostel details populated");
    assert(targetOwner.hostelDetails.planType === "Pro", "Linked subscription plan is Pro");

    // TEST 2: Suspend Owner Status & Revoke Sessions
    const mockResStatus = createMockRes();
    await setOwnerStatus({ params: { id: testOwner._id.toString() }, body: { status: "suspended" } }, mockResStatus);
    assert(mockResStatus.statusCode === 200 && mockResStatus.body.success, "setOwnerStatus returns 200 on suspension");

    const updatedOwner = await Owner.findById(testOwner._id);
    assert(updatedOwner.status === "suspended", "Owner status in DB updated to 'suspended'");

    const updatedSession = await OwnerSession.findById(testSession._id);
    assert(updatedSession.isRevoked === true, "Active sessions are revoked upon owner suspension");

    // TEST 3: Secure Temporary Password Reset
    const mockResReset = createMockRes();
    await resetOwnerTempPassword({ params: { id: testOwner._id.toString() } }, mockResReset);
    assert(mockResReset.statusCode === 200 && mockResReset.body.success, "resetOwnerTempPassword returns 200 with credentials");
    assert(mockResReset.body.credentials && mockResReset.body.credentials.tempPassword, "Temporary password returned once to admin");

    const tempPassword = mockResReset.body.credentials.tempPassword;
    const postResetOwner = await Owner.findById(testOwner._id);
    assert(postResetOwner.mustChangePassword === true, "mustChangePassword flag set to true");
    assert(postResetOwner.firstLogin === true, "firstLogin flag set to true");
    
    // Verify password in DB is bcrypt hash, NOT plaintext
    const isBcryptHash = /^\$2[aby]\$\d{2}\$.{53}$/.test(postResetOwner.password);
    assert(isBcryptHash, "Stored password is a secure bcrypt hash, NEVER plaintext");
    
    const isValidHash = await bcrypt.compare(tempPassword, postResetOwner.password);
    assert(isValidHash, "Bcrypt hash in database matches the generated temporary password");

    // Cleanup test data
    await Owner.findByIdAndDelete(testOwner._id);
    await Hostel.findByIdAndDelete(testHostel._id);
    await Subscription.findByIdAndDelete(testSub._id);
    await HostelRequest.findByIdAndDelete(testReq._id);
    await OwnerSession.findByIdAndDelete(testSession._id);

  } catch (err) {
    console.error("Owner CRM test error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
    console.log("\n========================================================");
    console.log(`OWNER CRM TESTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("========================================================\n");
    process.exit(failed > 0 ? 1 : 0);
  }
}

runOwnerCRMTests();
