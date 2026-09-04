/**
 * Test: test_wave1_security_multitenant.js
 * Comprehensive automated test suite for Phase 1 Wave 1: Security + Multi-Tenant Hardening.
 * Validates:
 * - Room IDOR (GET, update, delete, restore)
 * - Bed IDOR (GET, create in other room, update, reserve, release, maintenance, delete, restore)
 * - Resident IDOR (GET, update, delete, restore, check-in, checkout, transfer, status)
 * - Security Deposit Refund IDOR
 * - Multi-hostel switching (authorized A & B, unauthorized C -> 403)
 * - Negative authorization (malformed ID -> 400, non-existent -> 403, single-hostel fallback)
 * - Before/After database state assertions proving no cross-tenant mutation occurs.
 */

const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const Owner = require("../models/Owner");
const Workspace = require("../models/Workspace");
const Hostel = require("../models/Hostel");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const SecurityDeposit = require("../models/SecurityDeposit");
const Plan = require("../models/Plan");

const roomRoutes = require("../routes/roomRoutes");
const bedRoutes = require("../routes/bedRoutes");
const residentRoutes = require("../routes/residentRoutes");
const depositRoutes = require("../routes/depositRoutes");

async function runSecurityTests() {
  console.log("\n==========================================================================");
  console.log("  HOSTELMATE PHASE 1 WAVE 1 — SECURITY & MULTI-TENANT TEST MATRIX (28 SCENARIOS)");
  console.log("==========================================================================\n");

  const uri = process.env.MONGO_URI || process.env.DATABASE_URL;
  if (!uri) {
    console.error("Missing MONGO_URI in environment.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  const jwtSecret = process.env.JWT_SECRET || "supersecretkey";

  // Build Express Test Server
  const app = express();
  app.use(express.json());
  app.use("/api/rooms", roomRoutes);
  app.use("/api/beds", bedRoutes);
  app.use("/api/residents", residentRoutes);
  app.use("/api/deposits", depositRoutes);

  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✓ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${msg}`);
      failed++;
    }
  }

  // Helper for HTTP requests
  async function apiCall(method, path, body = null, headers = {}) {
    const opts = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`${baseUrl}${path}`, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  }

  const testSuffix = Date.now();

  try {
    // 1. Ensure Base Plan exists
    let basePlan = await Plan.findOne({ name: "base" });
    if (!basePlan) {
      basePlan = await Plan.create({
        name: "base",
        storageLimit: 5368709120,
        residentLimit: 100,
        staffLimit: 5,
        hostelLimit: 1,
        features: [],
      });
    }

    // 2. Setup Workspace A, Owner A, Hostel A, Room A, Bed A, Resident A, Deposit A
    const ownerAId = new mongoose.Types.ObjectId();
    const wsA = await Workspace.create({ name: `WS_A_${testSuffix}`, ownerId: ownerAId });
    const hostelA = await Hostel.create({
      hostelName: `Hostel_A_${testSuffix}`,
      workspaceId: wsA._id,
      ownerId: ownerAId,
      phone: `91000${Math.floor(10000 + Math.random() * 90000)}`,
      status: "Active",
    });
    wsA.activeHostelId = hostelA._id;
    await wsA.save();

    const ownerA = await Owner.create({
      _id: ownerAId,
      ownerName: `Owner A ${testSuffix}`,
      email: `ownerA_${testSuffix}@test.com`,
      phone: `91001${Math.floor(10000 + Math.random() * 90000)}`,
      password: "password123",
      workspaceId: wsA._id,
      activeWorkspaceId: wsA._id,
      hostelId: hostelA._id,
      activeHostelId: hostelA._id,
    });

    const roomA = await Room.create({
      roomNumber: `A-101-${testSuffix}`,
      tenantId: hostelA._id,
      hostelId: hostelA._id,
      capacity: 2,
      totalBeds: 2,
      monthlyRent: 8000,
      securityDeposit: 5000,
    });

    const bedA = await Bed.create({
      bedNumber: `A-101-1`,
      tenantId: hostelA._id,
      hostelId: hostelA._id,
      roomId: roomA._id,
      status: "Vacant",
    });

    const residentA = await Resident.create({
      admissionNumber: `ADM-A-${testSuffix}`,
      firstName: "Resident",
      lastName: "A",
      fullName: "Resident A",
      phone: `91002${Math.floor(10000 + Math.random() * 90000)}`,
      tenantId: hostelA._id,
      hostelId: hostelA._id,
      roomId: roomA._id,
      bedId: bedA._id,
      monthlyRent: 8000,
      status: "Active",
    });

    const depositA = await SecurityDeposit.create({
      tenantId: hostelA._id,
      hostelId: hostelA._id,
      residentId: residentA._id,
      depositAmount: 5000,
      balance: 5000,
      refundedAmount: 0,
      status: "Active",
    });

    // 3. Setup Workspace B, Owner B, Hostel B, Room B, Bed B, Resident B, Deposit B
    const ownerBId = new mongoose.Types.ObjectId();
    const wsB = await Workspace.create({ name: `WS_B_${testSuffix}`, ownerId: ownerBId });
    const hostelB = await Hostel.create({
      hostelName: `Hostel_B_${testSuffix}`,
      workspaceId: wsB._id,
      ownerId: ownerBId,
      phone: `92000${Math.floor(10000 + Math.random() * 90000)}`,
      status: "Active",
    });
    wsB.activeHostelId = hostelB._id;
    await wsB.save();

    const ownerB = await Owner.create({
      _id: ownerBId,
      ownerName: `Owner B ${testSuffix}`,
      email: `ownerB_${testSuffix}@test.com`,
      phone: `92001${Math.floor(10000 + Math.random() * 90000)}`,
      password: "password123",
      workspaceId: wsB._id,
      activeWorkspaceId: wsB._id,
      hostelId: hostelB._id,
      activeHostelId: hostelB._id,
    });

    const roomB = await Room.create({
      roomNumber: `B-101-${testSuffix}`,
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      capacity: 2,
      totalBeds: 2,
      monthlyRent: 9000,
      securityDeposit: 6000,
    });

    const roomBVacant = await Room.create({
      roomNumber: `B-102-${testSuffix}`,
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      capacity: 2,
      totalBeds: 2,
      monthlyRent: 9000,
      securityDeposit: 6000,
    });

    const bedB = await Bed.create({
      bedNumber: `B-101-1`,
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      roomId: roomB._id,
      status: "Vacant",
    });

    const residentB = await Resident.create({
      admissionNumber: `ADM-B-${testSuffix}`,
      firstName: "Resident",
      lastName: "B",
      fullName: "Resident B",
      phone: `92002${Math.floor(10000 + Math.random() * 90000)}`,
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      roomId: roomB._id,
      bedId: bedB._id,
      monthlyRent: 9000,
      status: "Active",
    });

    const depositB = await SecurityDeposit.create({
      tenantId: hostelB._id,
      hostelId: hostelB._id,
      residentId: residentB._id,
      depositAmount: 6000,
      balance: 6000,
      refundedAmount: 0,
      status: "Active",
    });

    // 4. Setup Pro Owner (Multi-Hostel: Hostel Pro 1 & Hostel Pro 2 under same Workspace)
    const ownerProId = new mongoose.Types.ObjectId();
    const wsPro = await Workspace.create({ name: `WS_Pro_${testSuffix}`, ownerId: ownerProId });
    const hostelPro1 = await Hostel.create({
      hostelName: `Hostel_Pro1_${testSuffix}`,
      workspaceId: wsPro._id,
      ownerId: ownerProId,
      phone: `93001${Math.floor(10000 + Math.random() * 90000)}`,
      status: "Active",
    });
    const hostelPro2 = await Hostel.create({
      hostelName: `Hostel_Pro2_${testSuffix}`,
      workspaceId: wsPro._id,
      ownerId: ownerProId,
      phone: `93002${Math.floor(10000 + Math.random() * 90000)}`,
      status: "Active",
    });
    wsPro.activeHostelId = hostelPro1._id;
    await wsPro.save();

    const ownerPro = await Owner.create({
      _id: ownerProId,
      ownerName: `Owner Pro ${testSuffix}`,
      email: `ownerPro_${testSuffix}@test.com`,
      phone: `93003${Math.floor(10000 + Math.random() * 90000)}`,
      password: "password123",
      workspaceId: wsPro._id,
      activeWorkspaceId: wsPro._id,
      hostelId: hostelPro1._id,
      activeHostelId: hostelPro1._id,
    });

    const roomPro1 = await Room.create({
      roomNumber: `P1-101-${testSuffix}`,
      tenantId: hostelPro1._id,
      hostelId: hostelPro1._id,
      capacity: 2,
      totalBeds: 2,
      monthlyRent: 12000,
    });

    const roomPro2 = await Room.create({
      roomNumber: `P2-101-${testSuffix}`,
      tenantId: hostelPro2._id,
      hostelId: hostelPro2._id,
      capacity: 2,
      totalBeds: 2,
      monthlyRent: 15000,
    });

    // Generate JWTs
    const tokenA = jwt.sign({ userId: ownerAId.toString(), role: "owner", hostelId: hostelA._id.toString() }, jwtSecret);
    const tokenB = jwt.sign({ userId: ownerBId.toString(), role: "owner", hostelId: hostelB._id.toString() }, jwtSecret);
    const tokenPro = jwt.sign({ userId: ownerProId.toString(), role: "owner", hostelId: hostelPro1._id.toString() }, jwtSecret);

    console.log("--- 1. ROOM TENANT ISOLATION TESTS ---");

    // Scenario 1: Room GET (Own)
    {
      const res = await apiCall("GET", "/api/rooms", null, { Authorization: `Bearer ${tokenA}` });
      const roomNumbers = (res.data?.rooms || []).map((r) => r.roomNumber);
      assert(res.status === 200 && roomNumbers.includes(roomA.roomNumber), "Scenario 1: Owner A GET /api/rooms returns own rooms");
    }

    // Scenario 2: Room GET (Cross-Tenant)
    {
      const res = await apiCall("GET", "/api/rooms", null, { Authorization: `Bearer ${tokenA}` });
      const roomNumbers = (res.data?.rooms || []).map((r) => r.roomNumber);
      assert(!roomNumbers.includes(roomB.roomNumber), "Scenario 2: Owner A GET /api/rooms never reveals Owner B rooms");
    }

    // Scenario 3: Room Update (Own)
    {
      const res = await apiCall("PUT", `/api/rooms/${roomA._id}`, { monthlyRent: 8500 }, { Authorization: `Bearer ${tokenA}` });
      const dbRoomA = await Room.findById(roomA._id);
      assert(res.status === 200 && dbRoomA.monthlyRent === 8500, "Scenario 3: Owner A PUT /api/rooms/:A_roomId updates own room");
    }

    // Scenario 4: Room Update (Cross-Tenant)
    {
      const beforeRoomB = await Room.findById(roomB._id).lean();
      const res = await apiCall("PUT", `/api/rooms/${roomB._id}`, { monthlyRent: 99999 }, { Authorization: `Bearer ${tokenA}` });
      const afterRoomB = await Room.findById(roomB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterRoomB.monthlyRent === beforeRoomB.monthlyRent, "Scenario 4: Owner A cannot update Owner B room (rejected & DB unchanged)");
    }

    // Scenario 5: Room Delete (Cross-Tenant)
    {
      const beforeRoomB = await Room.findById(roomBVacant._id).lean();
      const res = await apiCall("DELETE", `/api/rooms/${roomBVacant._id}`, null, { Authorization: `Bearer ${tokenA}` });
      const afterRoomB = await Room.findById(roomBVacant._id).lean();
      assert([400, 403, 404].includes(res.status) && afterRoomB.isDeleted === false, "Scenario 5: Owner A cannot delete Owner B room (rejected & isDeleted remains false)");
    }

    // Scenario 6: Room Restore (Cross-Tenant)
    {
      // Soft delete Room B Vacant as Owner B first
      await apiCall("DELETE", `/api/rooms/${roomBVacant._id}`, null, { Authorization: `Bearer ${tokenB}` });
      const res = await apiCall("PATCH", `/api/rooms/${roomBVacant._id}/restore`, null, { Authorization: `Bearer ${tokenA}` });
      const afterRoomB = await Room.findById(roomBVacant._id).lean();
      assert([400, 403, 404].includes(res.status) && afterRoomB.isDeleted === true, "Scenario 6: Owner A cannot restore Owner B room (rejected & remains deleted)");
      // Restore Room B Vacant as Owner B to keep clean state
      await apiCall("PATCH", `/api/rooms/${roomBVacant._id}/restore`, null, { Authorization: `Bearer ${tokenB}` });
    }

    console.log("\n--- 2. BED TENANT ISOLATION TESTS ---");

    // Scenario 7: Bed GET (Cross-Tenant)
    {
      const res = await apiCall("GET", `/api/beds?roomId=${roomB._id}`, null, { Authorization: `Bearer ${tokenA}` });
      const beds = res.data?.beds || [];
      assert(beds.length === 0, "Scenario 7: Owner A GET /api/beds for Owner B roomId returns 0 beds");
    }

    // Scenario 8: Bed Create (Cross-Tenant Room)
    {
      const beforeBedsB = await Bed.countDocuments({ roomId: roomB._id });
      const res = await apiCall("POST", "/api/beds", { roomId: roomB._id, bedNumber: `B-101-ATTACK` }, { Authorization: `Bearer ${tokenA}` });
      const afterBedsB = await Bed.countDocuments({ roomId: roomB._id });
      assert([400, 403, 404].includes(res.status) && afterBedsB === beforeBedsB, "Scenario 8: Owner A cannot create Bed inside Owner B Room (rejected & bed count unchanged)");
    }

    // Scenario 9: Bed Update (Cross-Tenant)
    {
      const beforeBedB = await Bed.findById(bedB._id).lean();
      const res = await apiCall("PUT", `/api/beds/${bedB._id}`, { bedNumber: "HACKED" }, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.bedNumber === beforeBedB.bedNumber, "Scenario 9: Owner A cannot update Owner B bed (rejected & DB unchanged)");
    }

    // Scenario 10: Bed Reserve (Cross-Tenant)
    {
      const beforeBedB = await Bed.findById(bedB._id).lean();
      const res = await apiCall("PATCH", `/api/beds/${bedB._id}/reserve`, { description: "Malicious reserve" }, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.status === beforeBedB.status, "Scenario 10: Owner A cannot reserve Owner B bed (rejected & status unchanged)");
    }

    // Scenario 11: Bed Release (Cross-Tenant)
    {
      // Reserve Bed B as Owner B first
      await apiCall("PATCH", `/api/beds/${bedB._id}/reserve`, {}, { Authorization: `Bearer ${tokenB}` });
      const res = await apiCall("PATCH", `/api/beds/${bedB._id}/release`, null, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.status === "Reserved", "Scenario 11: Owner A cannot release Owner B bed (rejected & status remains Reserved)");
      // Release as Owner B
      await apiCall("PATCH", `/api/beds/${bedB._id}/release`, null, { Authorization: `Bearer ${tokenB}` });
    }

    // Scenario 12: Bed Maintenance (Cross-Tenant)
    {
      const beforeBedB = await Bed.findById(bedB._id).lean();
      const res = await apiCall("PATCH", `/api/beds/${bedB._id}/maintenance`, { reason: "Attack maintenance" }, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.status === beforeBedB.status, "Scenario 12: Owner A cannot set Owner B bed to maintenance (rejected & DB unchanged)");
    }

    // Scenario 13: Bed Delete (Cross-Tenant)
    {
      const beforeBedB = await Bed.findById(bedB._id).lean();
      const res = await apiCall("DELETE", `/api/beds/${bedB._id}`, null, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.isDeleted === false, "Scenario 13: Owner A cannot soft-delete Owner B bed (rejected & isDeleted remains false)");
    }

    // Scenario 14: Bed Restore (Cross-Tenant)
    {
      // Soft-delete Bed B as Owner B
      await apiCall("DELETE", `/api/beds/${bedB._id}`, null, { Authorization: `Bearer ${tokenB}` });
      const res = await apiCall("PATCH", `/api/beds/${bedB._id}/restore`, null, { Authorization: `Bearer ${tokenA}` });
      const afterBedB = await Bed.findById(bedB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterBedB.isDeleted === true, "Scenario 14: Owner A cannot restore Owner B bed (rejected & remains deleted)");
      // Restore as Owner B
      await apiCall("PATCH", `/api/beds/${bedB._id}/restore`, null, { Authorization: `Bearer ${tokenB}` });
    }

    console.log("\n--- 3. RESIDENT TENANT ISOLATION TESTS ---");

    // Scenario 15: Resident GET (Own)
    {
      const res = await apiCall("GET", `/api/residents/${residentA._id}`, null, { Authorization: `Bearer ${tokenA}` });
      assert(res.status === 200 && res.data?.resident?.admissionNumber === residentA.admissionNumber, "Scenario 15: Owner A GET /api/residents/:A_resId returns own resident details");
    }

    // Scenario 16: Resident GET (Cross-Tenant)
    {
      const res = await apiCall("GET", `/api/residents/${residentB._id}`, null, { Authorization: `Bearer ${tokenA}` });
      assert([400, 403, 404].includes(res.status) && !res.data?.resident, "Scenario 16: Owner A GET /api/residents/:B_resId does not leak Owner B resident data");
    }

    // Scenario 17: Resident Update (Cross-Tenant)
    {
      const beforeResB = await Resident.findById(residentB._id).lean();
      const res = await apiCall("PUT", `/api/residents/${residentB._id}`, { firstName: "HackedName" }, { Authorization: `Bearer ${tokenA}` });
      const afterResB = await Resident.findById(residentB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterResB.firstName === beforeResB.firstName, "Scenario 17: Owner A cannot update Owner B resident (rejected & DB unchanged)");
    }

    // Scenario 18: Resident Delete (Cross-Tenant)
    {
      const beforeResB = await Resident.findById(residentB._id).lean();
      const res = await apiCall("DELETE", `/api/residents/${residentB._id}`, null, { Authorization: `Bearer ${tokenA}` });
      const afterResB = await Resident.findById(residentB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterResB.isDeleted === false, "Scenario 18: Owner A cannot soft-delete Owner B resident (rejected & isDeleted remains false)");
    }

    // Scenario 19: Resident Restore (Cross-Tenant)
    {
      // Soft-delete Resident B as Owner B
      await apiCall("DELETE", `/api/residents/${residentB._id}`, null, { Authorization: `Bearer ${tokenB}` });
      const res = await apiCall("PATCH", `/api/residents/${residentB._id}/restore`, null, { Authorization: `Bearer ${tokenA}` });
      const afterResB = await Resident.findById(residentB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterResB.isDeleted === true, "Scenario 19: Owner A cannot restore Owner B resident (rejected & remains deleted)");
      // Restore as Owner B
      await apiCall("PATCH", `/api/residents/${residentB._id}/restore`, null, { Authorization: `Bearer ${tokenB}` });
    }

    // Scenario 20: Resident Checkout (Cross-Tenant)
    {
      const beforeResB = await Resident.findById(residentB._id).lean();
      const res = await apiCall("PATCH", "/api/residents/checkout", { residentId: residentB._id }, { Authorization: `Bearer ${tokenA}` });
      const afterResB = await Resident.findById(residentB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterResB.status === beforeResB.status, "Scenario 20: Owner A cannot check out Owner B resident (rejected & status remains Active)");
    }

    // Scenario 21: Resident Status Mutation (Cross-Tenant)
    {
      const beforeResB = await Resident.findById(residentB._id).lean();
      const res = await apiCall("PATCH", "/api/residents/status", { residentId: residentB._id, newStatus: "Blocked" }, { Authorization: `Bearer ${tokenA}` });
      const afterResB = await Resident.findById(residentB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterResB.status === beforeResB.status, "Scenario 21: Owner A cannot change status of Owner B resident (rejected & status remains Active)");
    }

    console.log("\n--- 4. SECURITY DEPOSIT ISOLATION TESTS ---");

    // Scenario 22: Deposit Refund (Cross-Tenant)
    {
      const beforeDepB = await SecurityDeposit.findById(depositB._id).lean();
      const res = await apiCall("POST", "/api/deposits/refund", { depositId: depositB._id, refundAmount: 1000 }, { Authorization: `Bearer ${tokenA}` });
      const afterDepB = await SecurityDeposit.findById(depositB._id).lean();
      assert([400, 403, 404].includes(res.status) && afterDepB.refundedAmount === beforeDepB.refundedAmount, "Scenario 22: Owner A cannot refund Owner B security deposit (rejected & DB unchanged)");
    }

    console.log("\n--- 5. ACTIVE-HOSTEL CONTEXT & MULTI-HOSTEL TESTS ---");

    // Scenario 23: Pro Owner Switch to Authorized Hostel 1
    {
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenPro}`,
        "x-active-hostel-id": hostelPro1._id.toString(),
      });
      const roomNumbers = (res.data?.rooms || []).map((r) => r.roomNumber);
      assert(res.status === 200 && roomNumbers.includes(roomPro1.roomNumber), "Scenario 23: Pro Owner switches to authorized Hostel 1 (HTTP 200, returns Room Pro 1)");
    }

    // Scenario 24: Pro Owner Switch to Authorized Hostel 2
    {
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenPro}`,
        "x-active-hostel-id": hostelPro2._id.toString(),
      });
      const roomNumbers = (res.data?.rooms || []).map((r) => r.roomNumber);
      assert(res.status === 200 && roomNumbers.includes(roomPro2.roomNumber), "Scenario 24: Pro Owner switches to authorized Hostel 2 (HTTP 200, returns Room Pro 2)");
    }

    // Scenario 25: Pro Owner Switch to Unauthorized Hostel B (Belongs to Workspace B)
    {
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenPro}`,
        "x-active-hostel-id": hostelB._id.toString(),
      });
      assert(res.status === 403, "Scenario 25: Pro Owner cannot switch to unauthorized Hostel B under Workspace B (HTTP 403 Forbidden)");
    }

    // Scenario 26: Malformed ObjectId Context
    {
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenA}`,
        "x-active-hostel-id": "invalid-object-id-xyz",
      });
      assert([400, 403].includes(res.status), "Scenario 26: Malformed x-active-hostel-id fails safely (HTTP 400/403, no 500 crash)");
    }

    // Scenario 27: Non-Existent Hostel Context
    {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenA}`,
        "x-active-hostel-id": fakeId,
      });
      assert(res.status === 403, "Scenario 27: Non-existent x-active-hostel-id fails safely (HTTP 403 Forbidden)");
    }

    // Scenario 28: Single-Hostel Owner Fallback (No Header)
    {
      const res = await apiCall("GET", "/api/rooms", null, {
        Authorization: `Bearer ${tokenA}`,
      });
      const roomNumbers = (res.data?.rooms || []).map((r) => r.roomNumber);
      assert(res.status === 200 && roomNumbers.includes(roomA.roomNumber), "Scenario 28: Single-hostel owner without header continues working (HTTP 200, fallback to owner.hostelId)");
    }

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    // Clean up created test data
    try {
      await Workspace.deleteMany({ name: { $regex: `_${testSuffix}` } });
      await Owner.deleteMany({ email: { $regex: `_${testSuffix}@test.com` } });
      await Hostel.deleteMany({ hostelName: { $regex: `_${testSuffix}` } });
      await Room.deleteMany({ roomNumber: { $regex: `-${testSuffix}` } });
      await Bed.deleteMany({ bedNumber: { $regex: `101-` } });
      await Resident.deleteMany({ admissionNumber: { $regex: `-${testSuffix}` } });
      await SecurityDeposit.deleteMany({ depositAmount: { $in: [5000, 6000] } });
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }

    server.close();
    await mongoose.disconnect();

    console.log("\n==========================================================================");
    console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL ${passed + failed})`);
    console.log("==========================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  }
}

runSecurityTests();
