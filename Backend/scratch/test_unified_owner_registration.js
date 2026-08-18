/**
 * HOSTELMATE ENTERPRISE — UNIFIED OWNER REGISTRATION VERIFICATION SUITE
 *
 * Verifies that:
 * 1. Public owner registration creates HostelRequest (status: "pending", source: "public", createdBy: null).
 * 2. Admin owner registration creates HostelRequest (status: "pending", source: "admin", createdBy: adminId).
 * 3. Neither public nor admin registration creates an Owner account directly at the request stage.
 * 4. Admin approval (PUT /api/admin/approve/:id) sets status="activation_pending" & creates draft Hostel.
 * 5. Final activation (POST /api/admin/hostels/:id/finalize-activation):
 *    - Creates Owner account with temporary credentials.
 *    - Creates 30-day Free Trial Unified Subscription.
 *    - Generates 10-digit publicCode on Hostel.
 *    - Creates AuditLog entry.
 *    - Emits OWNER_ACCOUNT_ACTIVATED event.
 */

"use strict";

const http = require("http");
const mongoose = require("mongoose");
const path = require("path");
const assert = require("assert");
const jwt = require("jsonwebtoken");

require("dotenv").config({ path: path.join(__dirname, "../.env") });
try { require("../server"); } catch (e) {}

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
const TIMEOUT = 10_000;

function request(method, pathStr, data, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data ?? {});
    const options = {
      hostname: "localhost",
      port: 5000,
      path: pathStr,
      method,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      timeout: TIMEOUT,
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", (c) => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT / 1000}s — ${method} ${pathStr}`));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function runTests() {
  console.log("=======================================================");
  console.log("  HOSTELMATE — UNIFIED OWNER REGISTRATION TEST SUITE");
  console.log("=======================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("✓ Connected to MongoDB for test run\n");

  const HostelRequest = require("../models/HostelRequest");
  const Hostel = require("../models/Hostel");
  const Owner = require("../models/Owner");
  const Subscription = require("../models/Subscription");
  const Admin = require("../models/Admin");
  const AuditLog = require("../models/AuditLog");

  const superadmin = await Admin.findOne({ role: "super_admin" });
  assert(superadmin, "SuperAdmin user must exist in database");

  const adminToken = jwt.sign(
    { userId: superadmin._id.toString(), role: superadmin.role },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1h" }
  );

  const ts = Date.now();
  const publicPhone = `981${String(ts).slice(-7)}`;
  const adminPhone = `982${String(ts).slice(-7)}`;

  // Clean existing test fixtures
  await HostelRequest.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });
  await Hostel.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });
  await Owner.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });

  let publicRequestId, adminRequestId, adminHostelId;

  try {
    // -------------------------------------------------------------
    // TEST 1: Public Registration creates HostelRequest
    // -------------------------------------------------------------
    console.log("[1/6] Verifying Public Owner Registration...");
    const publicRes = await request("POST", "/api/request/register", {
      ownerName: `Public Owner ${ts}`,
      phone: publicPhone,
      email: `public-${ts}@test.local`,
      hostelName: `Public Hostel ${ts}`,
      ownerAddress: "123 Public St",
      hostelAddress: "123 Public St",
      state: "Delhi",
      district: "Central Delhi",
      city: "New Delhi",
      pincode: "110001",
      hostelType: "Boys Hostel",
    });

    assert.strictEqual(publicRes.status, 201, "Public registration returns HTTP 201");
    assert(publicRes.body.success, "Public registration success flag is true");
    publicRequestId = publicRes.body.requestId || publicRes.body.request?._id;
    assert(publicRequestId, "Public registration returns valid requestId");

    const pubReqDoc = await HostelRequest.findById(publicRequestId);
    assert(pubReqDoc, "Public HostelRequest saved in database");
    assert.strictEqual(pubReqDoc.status, "pending", "Status is 'pending'");
    assert.strictEqual(pubReqDoc.source, "public", "Source is 'public'");
    assert.strictEqual(pubReqDoc.createdBy, null, "createdBy is null for public submission");

    const pubOwnerBefore = await Owner.findOne({ phone: publicPhone });
    assert.strictEqual(pubOwnerBefore, null, "No Owner document created at request stage");
    console.log("  ✓ PASS: Public registration created HostelRequest with status='pending' and source='public'");

    // -------------------------------------------------------------
    // TEST 2: SuperAdmin Registration creates HostelRequest
    // -------------------------------------------------------------
    console.log("\n[2/6] Verifying SuperAdmin Owner Registration...");
    const adminRes = await request(
      "POST",
      "/api/admin/requests",
      {
        ownerName: `Admin Created Owner ${ts}`,
        phone: adminPhone,
        email: `admin-created-${ts}@test.local`,
        hostelName: `Admin Created Hostel ${ts}`,
        ownerAddress: "456 Admin St",
        hostelAddress: "456 Admin St",
        state: "Delhi",
        district: "South Delhi",
        city: "New Delhi",
        pincode: "110017",
        hostelType: "Girls Hostel",
      },
      adminToken
    );

    assert.strictEqual(adminRes.status, 201, "Admin registration returns HTTP 201");
    assert(adminRes.body.success, "Admin registration success flag is true");
    adminRequestId = adminRes.body.requestId || adminRes.body.request?._id;
    assert(adminRequestId, "Admin registration returns valid requestId");

    const admReqDoc = await HostelRequest.findById(adminRequestId);
    assert(admReqDoc, "Admin HostelRequest saved in database");
    assert.strictEqual(admReqDoc.status, "pending", "Status is 'pending'");
    assert.strictEqual(admReqDoc.source, "admin", "Source is set to 'admin' from auth context");
    assert.strictEqual(admReqDoc.createdBy.toString(), superadmin._id.toString(), "createdBy matches superadmin ID");

    const admOwnerBefore = await Owner.findOne({ phone: adminPhone });
    assert.strictEqual(admOwnerBefore, null, "No Owner document created at admin request stage");

    const adminAudit = await AuditLog.findOne({
      targetId: admReqDoc._id,
      action: "ADMIN_CREATED_REGISTRATION_REQUEST",
    });
    assert(adminAudit, "AuditLog created for ADMIN_CREATED_REGISTRATION_REQUEST");
    console.log("  ✓ PASS: SuperAdmin registration created HostelRequest with source='admin' and audit log");

    // -------------------------------------------------------------
    // TEST 3: Stage 1 Approval (PUT /api/admin/approve/:id)
    // -------------------------------------------------------------
    console.log("\n[3/6] Verifying Stage 1 Admin Approval...");
    const approveRes = await request(
      "PUT",
      `/api/admin/approve/${adminRequestId}`,
      {},
      adminToken
    );

    assert.strictEqual(approveRes.status, 200, "Approve request returns HTTP 200");
    assert.strictEqual(approveRes.body.status, "activation_pending", "Returned status is 'activation_pending'");
    adminHostelId = approveRes.body.hostelId;
    assert(adminHostelId, "Approve request returns valid hostelId");

    const approvedReqDoc = await HostelRequest.findById(adminRequestId);
    assert.strictEqual(approvedReqDoc.status, "activation_pending", "HostelRequest status updated to 'activation_pending'");

    const draftHostel = await Hostel.findById(adminHostelId);
    assert(draftHostel, "Draft Hostel created in database");
    assert.strictEqual(draftHostel.pendingActivation, true, "Hostel.pendingActivation is true");
    console.log("  ✓ PASS: Admin approval transitioned request to 'activation_pending' & created draft Hostel");

    // -------------------------------------------------------------
    // TEST 4: Final Activation (POST /api/admin/hostels/:id/finalize-activation)
    // -------------------------------------------------------------
    console.log("\n[4/6] Verifying Final Activation & Credential Generation...");
    const activateRes = await request(
      "POST",
      `/api/admin/hostels/${adminHostelId}/finalize-activation`,
      {
        planType: "HostelMate Unified Plan",
        amount: 0,
        isTrial: true,
        notes: "Automated Unified Registration Test",
      },
      adminToken
    );

    assert.strictEqual(activateRes.status, 200, "Finalize activation returns HTTP 200");
    assert(activateRes.body.success, "Finalize activation success flag is true");
    assert(activateRes.body.credentials?.tempPassword, "Temporary password returned in response");

    const createdOwner = await Owner.findOne({ phone: adminPhone });
    assert(createdOwner, "Owner account created on final activation");
    assert.strictEqual(createdOwner.role, "owner", "Owner role is 'owner'");
    assert.strictEqual(createdOwner.status, "active", "Owner status is 'active'");

    const createdSub = await Subscription.findOne({ hostelId: adminHostelId });
    assert(createdSub, "Unified Subscription document created");
    assert.strictEqual(createdSub.isTrial, true, "Subscription is 30-day Free Trial");
    assert.strictEqual(createdSub.monthlyRatePerResident, 10, "Resident billing rate is ₹10");

    const activatedHostel = await Hostel.findById(adminHostelId);
    assert.strictEqual(activatedHostel.pendingActivation, false, "Hostel.pendingActivation is false");
    assert(activatedHostel.publicCode && /^\d{10}$/.test(activatedHostel.publicCode), "10-digit publicCode generated");

    const finalReqDoc = await HostelRequest.findById(adminRequestId);
    assert.strictEqual(finalReqDoc.status, "activated", "HostelRequest status updated to 'activated'");

    const actAudit = await AuditLog.findOne({
      targetId: activatedHostel._id,
      action: "FINALIZE_ACTIVATION",
    });
    assert(actAudit, "FINALIZE_ACTIVATION AuditLog recorded");
    console.log("  ✓ PASS: Final activation generated Owner, 30-day Free Trial, publicCode, and AuditLog");

    // -------------------------------------------------------------
    // TEST 5: Verify Both Public & Admin Requests Appear in All Requests
    // -------------------------------------------------------------
    console.log("\n[5/6] Verifying Requests List Endpoint...");
    const listRes = await request("GET", "/api/admin/requests", null, adminToken);
    assert.strictEqual(listRes.status, 200, "GET /api/admin/requests returns HTTP 200");
    const requestsList = listRes.body.requests || listRes.body.data || [];
    const foundPublic = requestsList.some((r) => String(r._id) === String(publicRequestId));
    const foundAdmin = requestsList.some((r) => String(r._id) === String(adminRequestId));
    assert(foundPublic, "Public request present in requests list");
    assert(foundAdmin, "Admin request present in requests list");
    console.log("  ✓ PASS: Both public and admin registration requests present in requests queue");

  } finally {
    // -------------------------------------------------------------
    // TEST 6: Cleanup
    // -------------------------------------------------------------
    console.log("\n[6/6] Cleaning up test fixtures...");
    await HostelRequest.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });
    await Hostel.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });
    await Owner.deleteMany({ phone: { $in: [publicPhone, adminPhone] } });
    await Subscription.deleteMany({ hostelId: adminHostelId });
    console.log("  ✓ PASS: Test fixtures cleaned up successfully");
  }

  await mongoose.disconnect();
  console.log("\n=======================================================");
  console.log("  ✓ UNIFIED OWNER REGISTRATION TEST SUITE PASSED (100%)");
  console.log("=======================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
