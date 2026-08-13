"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Room = require("../models/Room");
const Hostel = require("../models/Hostel");
const Bed = require("../models/Bed");
const { createRoom } = require("../controllers/roomController");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";

// Helper mock res factory
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
    },
  };
}

async function testRoomCreationPhase1() {
  console.log("==================================================");
  console.log("🟢 HOSTELMATE — ROOM CREATION PHASE 1 VERIFICATION");
  console.log("==================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log(" Connected to MongoDB");

  const ts = Date.now();
  const testHostel = await Hostel.create({
    hostelName: `RoomTestHostel_${ts}`,
    ownerName: "Room Test Owner",
    phone: `99${String(ts).slice(-8)}`,
    email: `roomtest_${ts}@example.com`,
  });

  const hostelId = testHostel._id;
  const mockUserCtx = { hostelId: String(hostelId), _id: String(new mongoose.Types.ObjectId()) };

  try {
    // -------------------------------------------------------------
    // TEST 1: Valid Standard Room Creation
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Valid Room Creation...");
    const req1 = {
      owner: mockUserCtx,
      body: {
        roomNumber: `R101_${ts}`,
        roomType: "Double",
        gender: "Male",
        capacity: 2,
        monthlyRent: 8000,
        securityDeposit: 5000,
      },
    };
    const res1 = createMockRes();
    await createRoom(req1, res1);

    if (res1.statusCode !== 201 || !res1.body?.success || !res1.body?.room) {
      throw new Error(`TEST 1 FAILED: Expected 201 Created, got ${res1.statusCode} - ${JSON.stringify(res1.body)}`);
    }
    console.log("✓ PASS [1/5]: Valid Room Created (ID:", res1.body.room._id, ")");

    // -------------------------------------------------------------
    // TEST 2: Co-Living Room Creation
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Co-Living Room Creation...");
    const req2 = {
      owner: mockUserCtx,
      body: {
        roomNumber: `R102_${ts}`,
        roomType: "Double",
        gender: "Co-Living",
        capacity: 2,
        monthlyRent: 9000,
      },
    };
    const res2 = createMockRes();
    await createRoom(req2, res2);

    if (res2.statusCode !== 201 || !res2.body?.success || res2.body?.room?.gender !== "Co-Living") {
      throw new Error(`TEST 2 FAILED: Co-Living room failed, got status ${res2.statusCode} - ${JSON.stringify(res2.body)}`);
    }
    console.log("✓ PASS [2/5]: Co-Living Room Created Successfully with gender 'Co-Living'");

    // -------------------------------------------------------------
    // TEST 3: Empty string buildingId and floorId ("" / "null")
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing empty string buildingId and floorId handling...");
    const req3 = {
      owner: mockUserCtx,
      body: {
        roomNumber: `R103_${ts}`,
        buildingId: "",
        floorId: "null",
        roomType: "Single",
        gender: "Female",
        capacity: 1,
        monthlyRent: "10000",
        securityDeposit: "5000",
      },
    };
    const res3 = createMockRes();
    await createRoom(req3, res3);

    if (res3.statusCode !== 201 || !res3.body?.success) {
      throw new Error(`TEST 3 FAILED: Empty buildingId/floorId caused error, got status ${res3.statusCode} - ${JSON.stringify(res3.body)}`);
    }
    if (res3.body.room.buildingId !== null || res3.body.room.floorId !== null) {
      throw new Error(`TEST 3 FAILED: Expected buildingId and floorId to be null, got buildingId=${res3.body.room.buildingId}`);
    }
    console.log("✓ PASS [3/5]: Empty buildingId and floorId sanitized cleanly to null without CastError");

    // -------------------------------------------------------------
    // TEST 4: Duplicate Room Creation
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing Duplicate Room Number handling...");
    const req4 = {
      owner: mockUserCtx,
      body: {
        roomNumber: `R101_${ts}`, // Same as TEST 1
        capacity: 2,
      },
    };
    const res4 = createMockRes();
    await createRoom(req4, res4);

    if (res4.statusCode !== 400 || res4.body?.message !== "Room already exists.") {
      throw new Error(`TEST 4 FAILED: Expected 400 'Room already exists.', got ${res4.statusCode} - ${JSON.stringify(res4.body)}`);
    }
    console.log("✓ PASS [4/5]: Duplicate room returned HTTP 400 with message 'Room already exists.'");

    // -------------------------------------------------------------
    // TEST 5: Missing Required Fields / Validation Error
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Missing Required Fields handling...");
    const req5 = {
      owner: mockUserCtx,
      body: {
        roomNumber: "", // Empty room number
        capacity: 0, // Invalid capacity
      },
    };
    const res5 = createMockRes();
    await createRoom(req5, res5);

    if (res5.statusCode !== 400 || res5.body?.message !== "Room validation failed" || !res5.body?.fields) {
      throw new Error(`TEST 5 FAILED: Expected structured validation error, got ${res5.statusCode} - ${JSON.stringify(res5.body)}`);
    }
    console.log("✓ PASS [5/5]: Missing room number returned HTTP 400 structured validation error with fields object:", res5.body.fields);

    console.log("\n==================================================");
    console.log("🎉 ALL ROOM CREATION PHASE 1 TESTS PASSED PERFECTLY!");
    console.log("==================================================");
  } finally {
    // Cleanup
    await Room.deleteMany({ hostelId });
    await Bed.deleteMany({ hostelId });
    await Hostel.findByIdAndDelete(hostelId);
    await mongoose.disconnect();
  }
}

testRoomCreationPhase1().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
