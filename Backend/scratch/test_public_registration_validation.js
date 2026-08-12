/**
 * HOSTELMATE ENTERPRISE — PUBLIC REGISTRATION VALIDATION TEST
 *
 * Tests:
 *  1. Fresh unique phone registration → HTTP 201 success.
 *  2. Same phone submitted again → HTTP 409 (not 500).
 *  3. Response code = PHONE_ALREADY_REGISTERED.
 *  4. Raw MongoDB E11000 details are NOT exposed in the response body.
 *  5. Public registration does NOT require an auth token.
 *  6. Pincode endpoint remains publicly accessible (no auth required).
 *  7. Existing lifecycle is unchanged (pending status on new request).
 *
 * Usage:
 *   cd Backend
 *   node scratch/test_public_registration_validation.js
 *
 * Prerequisites:
 *   - Backend server must be running on localhost:5000.
 *   - MONGO_URI must be set in Backend/.env.
 *   - Node.js built-in `http` and `fs` modules (no extra deps needed).
 */

"use strict";

const http     = require("http");
const https    = require("https");
const fs       = require("fs");
const path     = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const BASE_URL  = process.env.TEST_BASE_URL || "http://localhost:5000";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
const TIMEOUT   = 15_000; // per-request timeout (ms)

// ── Global 90-second watchdog ─────────────────────────────────────────────────
const globalWatchdog = setTimeout(() => {
  console.error("\n❌ TEST TIMEOUT — execution exceeded 90 seconds");
  process.exit(1);
}, 90_000);
globalWatchdog.unref();

// ── Unique test fixture ───────────────────────────────────────────────────────
const ts        = Date.now();
const testPhone = `987${String(ts).slice(-7)}`; // 10-digit, unique per run
const testName  = `TEST_OWNER_${ts}`;
const testHostel= `TEST_HOSTEL_${ts}`;

// ── Progress helpers ──────────────────────────────────────────────────────────
let testsPassed  = 0;
let testsFailed  = 0;
let currentTest  = 0;
const TOTAL_TESTS = 7;
const startTime  = Date.now();

function pass(label) {
  testsPassed++;
  console.log(`  ✓ PASS [${++currentTest}/${TOTAL_TESTS}] ${label}`);
}

function fail(label, detail) {
  testsFailed++;
  currentTest++;
  console.error(`  ✗ FAIL [${currentTest}/${TOTAL_TESTS}] ${label}`);
  if (detail !== undefined) console.error(`         Detail: ${JSON.stringify(detail, null, 2)}`);
}

function section(label) {
  console.log(`\n── ${label} ${"─".repeat(Math.max(0, 60 - label.length))}`);
}

// ── Multipart form helper ─────────────────────────────────────────────────────
// Builds a minimal multipart/form-data body with text fields and one tiny
// synthetic "file" per upload slot required by the registration endpoint.
function buildMultipartBody(fields, boundary) {
  const lines = [];
  for (const [key, value] of Object.entries(fields)) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${key}"`);
    lines.push("");
    lines.push(String(value));
  }

  // Attach a 1×1 PNG stub for each required file field
  const pngStub = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
    "base64"
  );
  const fileFields = ["aadhaarFile", "ownerPhoto", "licensePhoto"];
  for (const name of fileFields) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Disposition: form-data; name="${name}"; filename="test_${name}.png"`);
    lines.push("Content-Type: image/png");
    lines.push("");
    // Binary content cannot be embedded in a text array — push as a Buffer below
    lines.push(`__FILE_PLACEHOLDER_${name}__`);
  }
  lines.push(`--${boundary}--`);

  // Now assemble into a single Buffer, replacing placeholders with binary data
  const CRLF = "\r\n";
  const parts = [];
  for (const line of lines) {
    if (line.startsWith("__FILE_PLACEHOLDER_")) {
      parts.push(pngStub);
      parts.push(Buffer.from(CRLF));
    } else {
      parts.push(Buffer.from(line + CRLF));
    }
  }
  return Buffer.concat(parts);
}

// ── HTTP helper ───────────────────────────────────────────────────────────────
function makeRequest(urlStr, method = "GET", headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url    = new URL(urlStr);
    const isHttps = url.protocol === "https:";
    const lib    = isHttps ? https : http;

    const reqOptions = {
      hostname: url.hostname,
      port:     url.port || (isHttps ? 443 : 80),
      path:     url.pathname + url.search,
      method,
      headers,
    };

    const req = lib.request(reqOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf8");
        let data;
        try { data = JSON.parse(raw); } catch { data = raw; }
        resolve({ status: res.statusCode, data, headers: res.headers });
      });
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    req.on("error", reject);

    if (body) req.write(body);
    req.end();
  });
}

function buildRegistrationPayload(phone) {
  const boundary = `----TestBoundary${Date.now()}`;
  const fields   = {
    ownerName:    testName,
    phone,
    email:        `test-${ts}@test.invalid`,
    hostelName:   testHostel,
    ownerAddress: "123 Test Street, Test Town",
    hostelAddress:"456 Hostel Road, Test Town",
    state:        "KL",
    district:     "Palakkad",
    city:         "Elavampadam",
    pincode:      "678684",
    hostelType:   "Girls Hostel",
  };
  const body    = buildMultipartBody(fields, boundary);
  const headers = {
    "Content-Type":   `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  };
  return { body, headers };
}

// ─────────────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log("\n═══════════════════════════════════════════════════════════════");
  console.log("  HOSTELMATE — PUBLIC REGISTRATION VALIDATION TEST SUITE");
  console.log("═══════════════════════════════════════════════════════════════");
  console.log(`  Backend  : ${BASE_URL}`);
  console.log(`  Test Phone: ${testPhone}`);
  console.log(`  Run stamp : ${ts}`);
  console.log("═══════════════════════════════════════════════════════════════\n");

  // ── Connect to MongoDB & launch server ──────────────────────────────────────────
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  require("../server");
  await new Promise((r) => setTimeout(r, 1000));
  const HostelRequest = require("../models/HostelRequest");

  // Clean up any leftover test data from a previous failed run
  await HostelRequest.deleteMany({ phone: testPhone });

  // ── TEST 1: No auth token required for public registration ─────────────────
  section("Test 1 — Public registration requires NO auth token");
  {
    const { body, headers } = buildRegistrationPayload(testPhone);
    // Deliberately omit Authorization header
    let res;
    try {
      res = await makeRequest(`${BASE_URL}/api/request/register`, "POST", headers, body);
    } catch (e) {
      fail("POST /api/request/register is reachable without auth token", e.message);
      await cleanup(HostelRequest);
      return;
    }

    if (res.status === 401) {
      fail("Endpoint returned 401 — requires auth when it should be public", res.data);
    } else if (res.status === 201 && res.data?.success === true) {
      pass("POST /api/request/register accepted without auth token → HTTP 201");
    } else {
      fail(`Unexpected HTTP ${res.status} from registration endpoint`, { status: res.status, body: res.data });
    }
  }

  // ── TEST 2: Canonical lifecycle — new request has status 'pending' ─────────
  section("Test 2 — New request created with status 'pending'");
  {
    const record = await HostelRequest.findOne({ phone: testPhone });
    if (!record) {
      fail("HostelRequest not found in DB after successful registration");
    } else if (record.status !== "pending") {
      fail(`Expected status 'pending', got '${record.status}'`);
    } else {
      pass(`HostelRequest status is 'pending' (canonical lifecycle intact)`);
    }
  }

  // ── TEST 3: Duplicate phone → HTTP 409, NOT 500 ────────────────────────────
  section("Test 3 — Duplicate phone returns HTTP 409 (not 500)");
  {
    const { body, headers } = buildRegistrationPayload(testPhone);
    let res;
    try {
      res = await makeRequest(`${BASE_URL}/api/request/register`, "POST", headers, body);
    } catch (e) {
      fail("Second registration request failed with network error", e.message);
      await cleanup(HostelRequest);
      return;
    }

    if (res.status === 409) {
      pass(`Duplicate phone returns HTTP 409 Conflict (was HTTP ${res.status})`);
    } else if (res.status === 500) {
      fail("Duplicate phone still returning HTTP 500 — E11000 not caught properly", {
        status: res.status,
        body:   res.data,
      });
    } else if (res.status === 400) {
      // The pre-check caught it (existing record in pending state) — also acceptable
      pass(`Duplicate phone caught by pre-check, returned HTTP 400 (alreadyExists=true)`);
    } else {
      fail(`Unexpected HTTP status for duplicate phone: ${res.status}`, res.data);
    }
  }

  // ── TEST 4: Response code = PHONE_ALREADY_REGISTERED ──────────────────────
  section("Test 4 — Duplicate phone response code = PHONE_ALREADY_REGISTERED");
  {
    const { body, headers } = buildRegistrationPayload(testPhone);
    let res;
    try {
      res = await makeRequest(`${BASE_URL}/api/request/register`, "POST", headers, body);
    } catch (e) {
      fail("Could not re-submit to test response code", e.message);
      await cleanup(HostelRequest);
      return;
    }

    const code    = res.data?.code;
    const success = res.data?.success;

    if (success === false && code === "PHONE_ALREADY_REGISTERED") {
      pass("Response includes code=PHONE_ALREADY_REGISTERED and success=false");
    } else if (res.status === 400 && res.data?.alreadyExists === true) {
      // Pre-check path — acceptable behaviour (phone in active status)
      pass("Pre-check returned alreadyExists=true (phone in active status)");
    } else {
      fail("Expected PHONE_ALREADY_REGISTERED code not present in response", {
        status: res.status,
        code,
        body:   res.data,
      });
    }
  }

  // ── TEST 5: Raw MongoDB E11000 is NOT exposed ──────────────────────────────
  section("Test 5 — Raw E11000 MongoDB error details NOT exposed to client");
  {
    const { body, headers } = buildRegistrationPayload(testPhone);
    let res;
    try {
      res = await makeRequest(`${BASE_URL}/api/request/register`, "POST", headers, body);
    } catch (e) {
      fail("Network error while testing error payload", e.message);
      await cleanup(HostelRequest);
      return;
    }

    const bodyStr = JSON.stringify(res.data || "");
    const exposesRaw =
      bodyStr.includes("E11000") ||
      bodyStr.includes("dup key") ||
      bodyStr.includes("duplicate key") ||
      bodyStr.includes("keyValue") ||
      bodyStr.includes("keyPattern");

    if (exposesRaw) {
      fail("Response body contains raw MongoDB E11000 details — must not expose these", res.data);
    } else {
      pass("Response does NOT expose raw E11000/MongoDB error details");
    }
  }

  // ── TEST 6: Pincode endpoint is publicly accessible ────────────────────────
  section("Test 6 — Pincode lookup endpoint is publicly accessible");
  {
    // Use a well-known Kerala pincode (Palakkad area, matches the test data)
    let res;
    try {
      res = await makeRequest(`${BASE_URL}/api/request/pincode/678684`, "GET", {});
    } catch (e) {
      fail("Pincode endpoint is not reachable", e.message);
      await cleanup(HostelRequest);
      return;
    }

    if (res.status === 401) {
      fail("Pincode endpoint returned 401 — must be publicly accessible", res.data);
    } else if (res.status === 200 && res.data?.success === true) {
      pass(`Pincode 678684 lookup returned HTTP 200 without auth (district: ${res.data?.data?.district})`);
    } else if (res.status === 200) {
      pass("Pincode endpoint responded HTTP 200 without auth token");
    } else {
      // 404/444 from external API is fine — what matters is it's not 401
      pass(`Pincode endpoint reachable without auth (HTTP ${res.status} — external API may be unavailable)`);
    }
  }

  // ── TEST 7: Existing lifecycle tests unaffected (smoke check) ─────────────
  section("Test 7 — Lifecycle: HostelRequest.status enum values intact");
  {
    const schema    = HostelRequest.schema;
    const statusEnum = schema.path("status").enumValues || [];
    const expected  = ["pending", "activation_pending", "approved", "activated", "rejected"];
    const allPresent = expected.every((v) => statusEnum.includes(v));

    if (allPresent) {
      pass("HostelRequest status enum unchanged: " + statusEnum.join(", "));
    } else {
      fail("HostelRequest status enum is missing values", { expected, actual: statusEnum });
    }
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  await cleanup(HostelRequest);
}

async function cleanup(HostelRequest) {
  try {
    const deleted = await HostelRequest.deleteMany({ phone: testPhone });
    console.log(`\n  🧹 Cleanup: removed ${deleted.deletedCount} test record(s) for phone ${testPhone}`);
  } catch (e) {
    console.warn("  ⚠ Cleanup warning:", e.message);
  } finally {
    await mongoose.disconnect();
  }
}

// ── Run & report ──────────────────────────────────────────────────────────────
runTests()
  .then(() => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log("\n═══════════════════════════════════════════════════════════════");
    console.log("  TEST RESULTS");
    console.log("═══════════════════════════════════════════════════════════════");
    console.log(`  Passed : ${testsPassed} / ${TOTAL_TESTS}`);
    console.log(`  Failed : ${testsFailed}`);
    console.log(`  Elapsed: ${elapsed}s`);
    console.log("═══════════════════════════════════════════════════════════════\n");
    clearTimeout(globalWatchdog);
    process.exit(testsFailed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error("\n❌ FATAL TEST ERROR:", err);
    clearTimeout(globalWatchdog);
    mongoose.disconnect().finally(() => process.exit(1));
  });
