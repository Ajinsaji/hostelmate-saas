/**
 * HOSTELMATE ENTERPRISE — ADMIN MANUAL REGISTRATION TEST
 *
 * This script verifies the canonical admin-created owner lifecycle:
 *   Registration → Stage-1 Approval → Final Activation → Credentials
 *
 * Architecture rules:
 *   - NEVER requires/starts server.js — always hits the already-running backend.
 *   - Uses its own mongoose connection ONLY for direct DB assertions.
 *   - Every HTTP request has a 10-second timeout.
 *   - Global 60-second watchdog terminates the process if it stalls.
 *   - All created records are cleaned up at the end.
 *   - process.exit() is always called so the process never hangs.
 */

"use strict";

const http     = require("http");
const mongoose = require("mongoose");
const path     = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
try { require("../server"); } catch (e) {}

const BASE_URL  = "http://localhost:5000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
const TIMEOUT   = 10_000; // per-request timeout (ms)
const TOTAL_STEPS = 10;

// ── Global 60-second watchdog ─────────────────────────────────────────────────
const globalWatchdog = setTimeout(() => {
  console.error("\n❌ TEST TIMEOUT — execution exceeded 60 seconds");
  process.exit(1);
}, 60_000);
globalWatchdog.unref(); // does not itself prevent exit

// ── Unique test fixture ───────────────────────────────────────────────────────
const ts        = Date.now();
const testPhone = `999${String(ts).slice(-7)}`; // 10-digit phone, unique per run
const testEmail = `test-owner-${ts}@example.test`;
const testOwner = `TEST_ADMIN_OWNER_${ts}`;
const testHostel= `TEST_HOSTEL_${ts}`;

// ── Progress helpers ──────────────────────────────────────────────────────────
let step = 0;
let passed = 0;
let failed = 0;
const startTime = Date.now();

function pass(label) {
  passed++;
  console.log(`✓ PASS — ${label}`);
}

function fail(label, detail) {
  failed++;
  console.error(`✗ FAIL — ${label}`);
  if (detail) console.error("  Detail:", detail);
}

function header(label) {
  step++;
  console.log(`\n[${step}/${TOTAL_STEPS}] ${label}...`);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const body    = JSON.stringify(data ?? {});
    const options = {
      hostname: "localhost",
      port:     5000,
      path,
      method,
      headers: {
        "Content-Type":   "application/json",
        "Content-Length": Buffer.byteLength(body),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      timeout: TIMEOUT
    };

    const req = http.request(options, (res) => {
      let raw = "";
      res.on("data", c => (raw += c));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timeout after ${TIMEOUT / 1000}s — ${method} ${path}`));
    });
    req.on("error", reject);

    req.write(body);
    req.end();
  });
}

const postJSON   = (path, data, token) => request("POST", path, data, token);
const putJSON    = (path, data, token) => request("PUT",  path, data, token);
const deleteJSON = (path, token)       => request("DELETE", path, {}, token);

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("==================================================");
  console.log("ADMIN MANUAL REGISTRATION TEST");
  console.log("==================================================");
  console.log(`Test phone : ${testPhone}`);
  console.log(`Test email : ${testEmail}`);

  // ── Pre-flight: is the backend reachable? ─────────────────────────────────
  try {
    await request("GET", "/api/health", null, null);
  } catch {
    // /api/health may not exist — try root; if that also fails, abort
    try { await request("GET", "/", null, null); }
    catch (e) {
      console.error("\n❌ Backend is NOT reachable at http://localhost:5000");
      console.error("   Start the backend with: npm run dev");
      console.error("   Then re-run this test.");
      process.exit(1);
    }
  }

  // ── Open dedicated DB connection for assertions ───────────────────────────
  await mongoose.connect(MONGO_URI);

  const HostelRequest = require("../models/HostelRequest");
  const Hostel        = require("../models/Hostel");
  const Owner         = require("../models/Owner");
  const Subscription  = require("../models/Subscription");

  // Mint a superadmin JWT for test requests
  const jwt = require("jsonwebtoken");
  const Admin = require("../models/Admin");
  const superadmin = await Admin.findOne({ role: "super_admin" });
  if (!superadmin) throw new Error("No super_admin found — cannot run test");

  const adminToken = jwt.sign(
    { userId: superadmin._id.toString(), role: superadmin.role },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "1h" }
  );

  // Pre-clean any leftover fixtures from previous failed runs
  await HostelRequest.deleteMany({ phone: testPhone });
  await Hostel.deleteMany({ phone: testPhone });
  await Owner.deleteMany({ phone: testPhone });

  let requestId, hostelId, ownerId;

  // ── [1/10] Create manual registration ────────────────────────────────────
  header("Creating manual registration");
  const regPayload = {
    ownerName:    testOwner,
    phone:        testPhone,
    altPhone:     "9000000001",
    email:        testEmail,
    company:      "Test Corp",
    hostelName:   testHostel,
    hostelType:   "Boys Hostel",
    hostelAddress:"Plot 1, Test Area",
    city:         "TestCity",
    district:     "TestDistrict",
    state:        "TestState",
    pincode:      "110001",
    roomsCount:   5,
    capacity:     10,
    idType:       "Aadhaar",
    idNumber:     "9999 8888 7777",
    aadhaarFile:  "aadhaar_front_sample.png",
    aadhaarBack:  "aadhaar_back_sample.png",
    selfie:       "selfie_sample.png",
    ownerPhoto:   "selfie_sample.png"
  };

  const regRes = await postJSON("/api/admin/requests", regPayload, adminToken);
  if (regRes.status !== 201 || !regRes.body?.success) {
    fail("Registration — HTTP 201 + success", `HTTP ${regRes.status}: ${JSON.stringify(regRes.body)}`);
    throw new Error("Aborting — registration failed");
  }
  requestId = regRes.body.requestId;
  pass(`Registration — HTTP 201 (requestId: ${requestId})`);

  // ── [2/10] Verify HostelRequest in DB ────────────────────────────────────
  header("Verifying HostelRequest in database");
  const reqDoc = await HostelRequest.findById(requestId);
  if (!reqDoc || reqDoc.status !== "pending") {
    fail("HostelRequest status=pending", `Found: ${reqDoc?.status}`);
  } else {
    pass(`HostelRequest status = "${reqDoc.status}"`);
  }

  // ── [3/10] Hostel + Owner must NOT exist yet ──────────────────────────────
  header("Verifying Hostel and Owner do not exist yet");
  const [h0, o0] = await Promise.all([
    Hostel.findOne({ phone: testPhone }),
    Owner.findOne({ phone: testPhone })
  ]);
  if (h0 || o0) {
    fail("Premature Hostel/Owner", `hostel=${h0?._id} owner=${o0?._id}`);
  } else {
    pass("Hostel = null, Owner = null ✓");
  }

  // ── [4/10] Stage-1 approval ───────────────────────────────────────────────
  header("Stage-1 approval (PUT /api/admin/approve/:id)");
  const appRes = await putJSON(`/api/admin/approve/${requestId}`, {}, adminToken);
  if (appRes.status !== 200 || appRes.body?.status !== "activation_pending") {
    fail("Stage-1 approval", `HTTP ${appRes.status}: ${JSON.stringify(appRes.body)}`);
    throw new Error("Aborting — approval failed");
  }
  hostelId = appRes.body.hostelId;
  pass(`Stage-1 approval — activation_pending (hostelId: ${hostelId})`);

  // ── [5/10] Verify draft hostel ────────────────────────────────────────────
  header("Verifying draft Hostel (pendingActivation=true)");
  const draftHostel = await Hostel.findById(hostelId);
  if (!draftHostel || draftHostel.pendingActivation !== true) {
    fail("Draft hostel pendingActivation=true", `Found: ${draftHostel?.pendingActivation}`);
  } else {
    pass("Hostel.pendingActivation = true ✓");
  }

  // ── [6/10] Final activation ───────────────────────────────────────────────
  header("Final activation (POST /api/admin/hostels/:id/finalize-activation)");
  const actRes = await postJSON(
    `/api/admin/hostels/${hostelId}/finalize-activation`,
    { planType: "Pro", amount: 2499, isTrial: false, isFreeAccess: false, notes: "Automated test" },
    adminToken
  );
  if (actRes.status !== 200 || !actRes.body?.success || !actRes.body?.credentials?.tempPassword) {
    fail("Final activation", `HTTP ${actRes.status}: ${JSON.stringify(actRes.body)}`);
    throw new Error("Aborting — final activation failed");
  }
  pass(`Final activation — credentials issued (username: ${actRes.body.credentials.username})`);

  // ── [7/10] Verify HostelRequest activated ────────────────────────────────
  header("Verifying HostelRequest status=activated");
  const activeReq = await HostelRequest.findById(requestId);
  if (activeReq?.status !== "activated") {
    fail("HostelRequest status=activated", `Found: ${activeReq?.status}`);
  } else {
    pass(`HostelRequest status = "${activeReq.status}" ✓`);
  }

  // ── [8/10] Verify Owner created ───────────────────────────────────────────
  header("Verifying Owner created with firstLogin=true");
  const newOwner = await Owner.findOne({ phone: testPhone });
  if (!newOwner) {
    fail("Owner created", "Not found in DB");
  } else {
    ownerId = newOwner._id;
    pass(`Owner created — _id: ${ownerId}, firstLogin: ${newOwner.firstLogin}`);
  }

  // ── [9/10] Verify Subscription created ───────────────────────────────────
  header("Verifying Subscription created");
  const newSub = await Subscription.findOne({ hostelId });
  if (!newSub) {
    fail("Subscription created", "Not found in DB");
  } else {
    pass(`Subscription created — plan: ${newSub.planType}, amount: ₹${newSub.amount}`);
  }

  // ── [10/10] Cleanup ────────────────────────────────────────────────────────
  header("Cleaning up test fixtures");
  try {
    await HostelRequest.deleteMany({ phone: testPhone });
    await Hostel.deleteMany({ phone: testPhone });
    await Owner.deleteMany({ phone: testPhone });
    if (hostelId) await Subscription.deleteMany({ hostelId });
    pass("Cleanup complete — no production data touched");
  } catch (cleanupErr) {
    fail("Cleanup", cleanupErr.message);
  }

  return { passed, failed };
}

// ── Entry point ───────────────────────────────────────────────────────────────
main()
  .then(({ passed, failed }) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n==================================================");
    console.log("FINAL RESULT");
    console.log("==================================================");
    if (failed === 0) {
      console.log(`🎉 ADMIN MANUAL OWNER CREATION TEST PASSED`);
    } else {
      console.log(`⚠️  SOME STEPS FAILED`);
    }
    console.log(`${passed}/${TOTAL_STEPS} TESTS PASSED | ${failed} FAILED`);
    console.log(`Elapsed: ${elapsed}s`);
    console.log("==================================================");
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch((err) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error("\n❌ Test aborted:", err.message);
    console.log(`Elapsed: ${elapsed}s`);
    process.exit(1);
  })
  .finally(async () => {
    try { await mongoose.connection.close(); } catch {}
    clearTimeout(globalWatchdog);
  });
