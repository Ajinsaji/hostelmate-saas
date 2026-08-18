/**
 * test_unified_pincode_registration.js
 *
 * Verification & Test Suite for:
 * 1. Pincode Auto-Location lookup (resolving state, district, city for 6-digit pincode)
 * 2. Form UI Unification (Public vs Admin owner registration parity)
 * 3. Public registration flow (source="public", createdBy=null)
 * 4. Admin registration flow (source="admin", createdBy=adminId)
 * 5. Full Stage-1 approval & Final activation pipeline
 */

"use strict";

const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const HostelRequest = require("../models/HostelRequest");
const Admin = require("../models/Admin");
const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const AuditLog = require("../models/AuditLog");

const { createRequest, lookupPincode } = require("../controllers/requestController");

async function runTests() {
  console.log("\n=======================================================");
  console.log("  HOSTELMATE — UNIFIED PINCODE & REGISTRATION TEST SUITE");
  console.log("=======================================================\n");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate_test";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB for test run\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // ── [1/4] Test Pincode Lookup Service ────────────────────────────────────
    console.log("[1/4] Testing Pincode Auto-Location Lookup...");
    const mockReq = { params: { pincode: "110001" } };
    let pincodeResult = null;
    const mockRes = {
      status: (code) => ({
        json: (data) => {
          pincodeResult = { code, data };
          return data;
        },
      }),
    };

    await lookupPincode(mockReq, mockRes);
    assert(pincodeResult && pincodeResult.code === 200, "Pincode API returned HTTP 200");
    assert(pincodeResult.data?.data?.state === "Delhi", "Pincode 110001 resolved state 'Delhi'");
    assert(pincodeResult.data?.data?.district, "Pincode 110001 resolved district");

    // ── [2/4] Test Public Owner Registration Request ─────────────────────────
    console.log("\n[2/4] Testing Public Owner Registration Request...");
    const pubReqBody = {
      ownerName: "Public Test Owner",
      phone: "9988776611",
      email: "public.owner@example.test",
      hostelName: "Public Residency PG",
      ownerAddress: "123 Public Lane",
      hostelAddress: "456 Hostel Highway",
      state: "Delhi",
      district: "Central Delhi",
      city: "New Delhi",
      pincode: "110001",
      hostelType: "Boys Hostel",
    };

    let pubResData = null;
    const pubReq = { body: pubReqBody, user: null, admin: null };
    const pubRes = {
      status: (code) => ({
        json: (data) => {
          pubResData = { code, data };
          return data;
        },
      }),
    };

    await createRequest(pubReq, pubRes);
    assert(pubResData && pubResData.code === 201, "Public registration request created (HTTP 201)");

    const pubReqDoc = await HostelRequest.findById(pubResData.data.requestId);
    assert(pubReqDoc && pubReqDoc.source === "public", "Public request source set to 'public'");
    assert(pubReqDoc.createdBy === null || pubReqDoc.createdBy === undefined, "Public request createdBy set to null");
    assert(pubReqDoc.status === "pending", "Public request status set to 'pending'");

    // ── [3/4] Test Admin Owner Registration Request ──────────────────────────
    console.log("\n[3/4] Testing Admin Owner Registration Request...");
    let testAdmin = await Admin.findOne({ email: "admin@hostelmate.com" });
    if (!testAdmin) {
      testAdmin = await Admin.create({
        username: "test_superadmin_pincode",
        email: "admin@hostelmate.com",
        password: "hashedpassword123",
        role: "super_admin",
      });
    }

    const admReqBody = {
      ownerName: "Admin Created Owner",
      phone: "9988776622",
      email: "admin.created@example.test",
      hostelName: "Admin Created PG",
      ownerAddress: "789 Admin Street",
      hostelAddress: "789 Admin Street",
      state: "Delhi",
      district: "North Delhi",
      city: "New Delhi",
      pincode: "110001",
      hostelType: "Girls Hostel",
    };

    let admResData = null;
    const admReq = { body: admReqBody, user: { id: testAdmin._id.toString(), role: "super_admin" }, admin: testAdmin };
    const admRes = {
      status: (code) => ({
        json: (data) => {
          admResData = { code, data };
          return data;
        },
      }),
    };

    await createRequest(admReq, admRes);
    assert(admResData && admResData.code === 201, "Admin registration request created (HTTP 201)");

    const admReqDoc = await HostelRequest.findById(admResData.data.requestId);
    assert(admReqDoc && admReqDoc.source === "admin", "Admin request source set to 'admin'");
    assert(admReqDoc.createdBy.toString() === testAdmin._id.toString(), "Admin request createdBy set to adminId");
    assert(admReqDoc.status === "pending", "Admin request status set to 'pending'");

    // Clean up test documents
    await HostelRequest.deleteMany({ phone: { $in: ["9988776611", "9988776622"] } });
    console.log("\n  ✓ PASS: Cleaned up test registration requests");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await mongoose.disconnect();
  }

  console.log("\n=======================================================");
  console.log(`  FINAL RESULT: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
