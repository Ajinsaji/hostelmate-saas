const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config({ path: require("path").join(__dirname, "../.env") });

const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const OwnerSession = require("../models/OwnerSession");
const { loginOwner } = require("../controllers/ownerController");
const { getActiveSessions, revokeSession, revokeAllOtherSessions } = require("../controllers/ownerSessionController");

async function runMultiDeviceSessionTest() {
  console.log("==================================================");
  console.log("🔒 STARTING MULTI-DEVICE SESSION INTEGRATION TEST");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log("✓ Connected to MongoDB");

  const testPhoneA = "8880001111";
  const testPhoneB = "8880002222";
  const testPassword = "Password123@";

  // Clean up any existing test records
  await Owner.deleteMany({ phone: { $in: [testPhoneA, testPhoneB] } });
  await Hostel.deleteMany({ name: { $in: ["Session Hostel A", "Session Hostel B"] } });

  // Create Test Hostel A & Owner A
  const hostelA = await Hostel.create({
    name: "Session Hostel A",
    pendingActivation: false,
    address: "123 Session St",
    city: "Delhi",
    state: "Delhi",
  });

  const bcrypt = require("bcryptjs");
  const hashedPassword = await bcrypt.hash(testPassword, 10);

  const ownerA = await Owner.create({
    ownerName: "Owner Device Test A",
    phone: testPhoneA,
    email: "ownerA@sessiontest.com",
    password: hashedPassword,
    hostelId: hostelA._id,
    status: "active",
    onboardingCompleted: true,
    firstLogin: false,
  });

  // Create Test Hostel B & Owner B (for cross-owner RBAC test)
  const hostelB = await Hostel.create({
    name: "Session Hostel B",
    pendingActivation: false,
    address: "456 Session St",
    city: "Delhi",
    state: "Delhi",
  });

  const ownerB = await Owner.create({
    ownerName: "Owner Device Test B",
    phone: testPhoneB,
    email: "ownerB@sessiontest.com",
    password: hashedPassword,
    hostelId: hostelB._id,
    status: "active",
    onboardingCompleted: true,
    firstLogin: false,
  });

  // Mock Res object builder
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      data: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.data = payload;
        return this;
      },
    };
    return res;
  };

  // --- STEP 1: Login Device A (Windows Laptop) ---
  console.log("\n--- STEP 1: Login Device A (Windows Laptop) ---");
  const reqDeviceA = {
    body: {
      phone: testPhoneA,
      password: testPassword,
      deviceId: "dev-windows-laptop-001",
      deviceName: "Windows 11 Laptop • Chrome",
    },
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
    },
  };
  const resDeviceA = createMockRes();
  await loginOwner(reqDeviceA, resDeviceA);

  if (!resDeviceA.data?.success || !resDeviceA.data?.token) {
    throw new Error("Device A login failed: " + JSON.stringify(resDeviceA.data));
  }
  const tokenA = resDeviceA.data.token;
  const payloadA = jwt.verify(tokenA, process.env.JWT_SECRET);
  console.log("✓ Device A logged in. SessionId A:", payloadA.sessionId);

  // --- STEP 2: Login Device B (Android Phone) ---
  console.log("\n--- STEP 2: Login Device B (Android Phone) ---");
  const reqDeviceB = {
    body: {
      phone: testPhoneA,
      password: testPassword,
      deviceId: "dev-android-phone-002",
      deviceName: "Samsung Galaxy S23 • Chrome Mobile",
    },
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 14; SM-S911B) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile",
    },
  };
  const resDeviceB = createMockRes();
  await loginOwner(reqDeviceB, resDeviceB);

  if (!resDeviceB.data?.success || !resDeviceB.data?.token) {
    throw new Error("Device B login failed: " + JSON.stringify(resDeviceB.data));
  }
  const tokenB = resDeviceB.data.token;
  const payloadB = jwt.verify(tokenB, process.env.JWT_SECRET);
  console.log("✓ Device B logged in. SessionId B:", payloadB.sessionId);

  // --- STEP 3: List Active Sessions for Owner A ---
  console.log("\n--- STEP 3: Fetch Active Sessions for Device A ---");
  const reqList = {
    owner: { ownerId: ownerA._id, hostelId: hostelA._id, role: "owner" },
    user: { id: ownerA._id },
    sessionId: payloadA.sessionId,
    headers: { "x-session-id": payloadA.sessionId },
  };
  const resList = createMockRes();
  await getActiveSessions(reqList, resList);

  console.log("Active Sessions Count:", resList.data?.count);
  if (resList.data?.count !== 2) {
    throw new Error(`Expected 2 active sessions, found ${resList.data?.count}`);
  }

  const currentSess = resList.data.sessions.find((s) => s.currentSession);
  const otherSess = resList.data.sessions.find((s) => !s.currentSession);

  if (!currentSess || currentSess.sessionId !== payloadA.sessionId) {
    throw new Error("Current session identification failed!");
  }
  if (!otherSess || otherSess.sessionId !== payloadB.sessionId) {
    throw new Error("Other session identification failed!");
  }
  console.log("✓ Confirmed: Device A identified as currentSession, Device B as otherSession");

  // --- STEP 4: Revoke Device B from Device A ---
  console.log("\n--- STEP 4: Revoke Device B from Device A ---");
  const reqRevokeB = {
    owner: { ownerId: ownerA._id, hostelId: hostelA._id, role: "owner" },
    user: { id: ownerA._id },
    sessionId: payloadA.sessionId,
    params: { sessionId: payloadB.sessionId },
    headers: { "x-session-id": payloadA.sessionId },
  };
  const resRevokeB = createMockRes();
  await revokeSession(reqRevokeB, resRevokeB);

  if (!resRevokeB.data?.success) {
    throw new Error("Failed to revoke Device B: " + resRevokeB.data?.message);
  }
  console.log("✓ Device B revoked successfully!");

  // Verify Device B is marked revoked in DB
  const sessionBDoc = await OwnerSession.findOne({ sessionId: payloadB.sessionId });
  if (!sessionBDoc || !sessionBDoc.isRevoked) {
    throw new Error("Device B DB record is not marked as revoked!");
  }
  console.log("✓ Confirmed: Device B isRevoked = true in DB");

  // --- STEP 5: Test Revocation Enforcement on Protected Endpoint ---
  console.log("\n--- STEP 5: Verify Revoked Token Rejection ---");
  const authMiddleware = require("../middleware/auth").auth;

  const reqTestRevoked = {
    headers: { authorization: `Bearer ${tokenB}` },
  };
  const resTestRevoked = createMockRes();

  let nextCalled = false;
  await authMiddleware(reqTestRevoked, resTestRevoked, () => {
    nextCalled = true;
  });

  if (nextCalled || resTestRevoked.statusCode !== 401) {
    throw new Error("SECURITY FAILURE: Revoked session was NOT blocked!");
  }
  console.log("✓ SECURITY PASS: Revoked session B returned HTTP 401 ('" + resTestRevoked.data?.message + "')");

  // Verify Device A remains valid
  const reqTestActive = {
    headers: { authorization: `Bearer ${tokenA}` },
  };
  const resTestActive = createMockRes();
  let nextCalledActive = false;
  await authMiddleware(reqTestActive, resTestActive, () => {
    nextCalledActive = true;
  });

  if (!nextCalledActive) {
    throw new Error("Device A was unexpectedly blocked!");
  }
  console.log("✓ Active session A passed authentication check cleanly!");

  // --- STEP 6: Test Revoke All Other Devices ---
  console.log("\n--- STEP 6: Test Revoke All Other Devices ---");
  // Login Device C (iPhone)
  const reqDeviceC = {
    body: {
      phone: testPhoneA,
      password: testPassword,
      deviceId: "dev-iphone-003",
      deviceName: "iPhone 15 Pro • Safari",
    },
    headers: {
      "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    },
  };
  const resDeviceC = createMockRes();
  await loginOwner(reqDeviceC, resDeviceC);
  const tokenC = resDeviceC.data.token;
  const payloadC = jwt.verify(tokenC, process.env.JWT_SECRET);
  console.log("✓ Device C (iPhone) logged in. SessionId C:", payloadC.sessionId);

  // Revoke all other devices from Device A
  const reqRevokeOthers = {
    owner: { ownerId: ownerA._id, hostelId: hostelA._id, role: "owner" },
    user: { id: ownerA._id },
    sessionId: payloadA.sessionId,
    headers: { "x-session-id": payloadA.sessionId },
  };
  const resRevokeOthers = createMockRes();
  await revokeAllOtherSessions(reqRevokeOthers, resRevokeOthers);

  console.log("✓ Revoke all others result:", resRevokeOthers.data?.message);

  // Verify Device C is now revoked
  const reqTestC = {
    headers: { authorization: `Bearer ${tokenC}` },
  };
  const resTestC = createMockRes();
  let nextCalledC = false;
  await authMiddleware(reqTestC, resTestC, () => {
    nextCalledC = true;
  });

  if (nextCalledC || resTestC.statusCode !== 401) {
    throw new Error("Device C was not revoked by revoke-others!");
  }
  console.log("✓ Confirmed: Device C is revoked and rejected with 401");

  // Verify Device A is STILL active
  let nextCalledA2 = false;
  await authMiddleware({ headers: { authorization: `Bearer ${tokenA}` } }, createMockRes(), () => {
    nextCalledA2 = true;
  });
  if (!nextCalledA2) {
    throw new Error("Device A was incorrectly revoked by revoke-others!");
  }
  console.log("✓ Confirmed: Device A remains active!");

  // --- STEP 7: Cross-Owner Authorization Security Check ---
  console.log("\n--- STEP 7: Cross-Owner RBAC Isolation Check ---");
  // Owner B attempts to revoke Owner A's session A
  const reqCrossOwner = {
    owner: { ownerId: ownerB._id, hostelId: hostelB._id, role: "owner" },
    user: { id: ownerB._id },
    sessionId: "owner-b-session",
    params: { sessionId: payloadA.sessionId },
    headers: { "x-session-id": "owner-b-session" },
  };
  const resCrossOwner = createMockRes();
  await revokeSession(reqCrossOwner, resCrossOwner);

  if (resCrossOwner.statusCode !== 404) {
    throw new Error("SECURITY FAILURE: Owner B was able to access/revoke Owner A's session!");
  }
  console.log("✓ SECURITY PASS: Cross-owner session revocation blocked with HTTP 404!");

  // Cleanup test data
  await Owner.deleteMany({ phone: { $in: [testPhoneA, testPhoneB] } });
  await Hostel.deleteMany({ name: { $in: ["Session Hostel A", "Session Hostel B"] } });
  await OwnerSession.deleteMany({ ownerId: { $in: [ownerA._id, ownerB._id] } });

  console.log("\n==================================================");
  console.log("🎉 ALL MULTI-DEVICE SESSION INTEGRATION TESTS PASSED 100%!");
  console.log("==================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runMultiDeviceSessionTest().catch((err) => {
  console.error("❌ INTEGRATION TEST FAILED:", err);
  process.exit(1);
});
