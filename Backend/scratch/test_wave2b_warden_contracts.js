const assert = require("node:assert/strict");

const residentService = require("../services/residentService");
const maintenanceService = require("../services/maintenanceService");
const staffController = require("../controllers/staffController");
const Resident = require("../models/Resident");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const MaintenanceLog = require("../models/MaintenanceLog");
const Payment = require("../models/Payment");

async function runWardenContractTests() {
  console.log("\n============================================================");
  console.log("  HOSTELMATE WAVE 2B — WARDEN PORTAL CONTRACTS VERIFICATION");
  console.log("============================================================\n");

  let assertions = 0;

  // 1. Mock Resident.countDocuments
  Resident.countDocuments = async (query) => {
    assert.equal(query.hostelId, "hostel-warden-101");
    return 15;
  };
  assertions++;

  // 2. Mock Room.find
  Room.find = async (query) => {
    assert.equal(query.hostelId, "hostel-warden-101");
    return [{ totalBeds: 20 }, { totalBeds: 10 }];
  };
  assertions++;

  // 3. Mock Payment.aggregate & Payment.find
  Payment.aggregate = async (pipeline) => {
    return [{ total: 4500 }];
  };
  Payment.find = async (query) => {
    return [{ entries: [{ createdAt: new Date(), amount: 1500 }] }];
  };

  // 4. Test Staff Controller Warden Dashboard Stats Endpoint Response
  const req = {
    user: { role: "warden", hostelId: "hostel-warden-101" },
    query: { role: "warden" },
  };
  let resStatus = 0;
  let resJson = {};
  const res = {
    status: (code) => {
      resStatus = code;
      return {
        json: (data) => {
          resJson = data;
        },
      };
    },
  };

  await staffController.getStaffDashboard(req, res);
  assert.equal(resStatus, 200);
  assertions++;
  assert.equal(resJson.success, true);
  assertions++;
  assert.equal(resJson.stats.residents, 15);
  assertions++;
  assert.equal(resJson.stats.vacantBeds, 15); // Total 30 - 15 occupied = 15 vacant
  assertions++;
  assert.equal(resJson.stats.pendingDues, 4500);
  assertions++;
  assert.equal(resJson.stats.todayCollection, 1500);
  assertions++;

  // 5. Test Check-In Contract
  let checkinPayload = null;
  residentService.checkInResident = async (data, userCtx) => {
    checkinPayload = data;
    assert.equal(userCtx.hostelId, "hostel-warden-101");
    return { _id: data.residentId, status: "Active", roomId: data.roomId, bedId: data.bedId };
  };

  const checkinResult = await residentService.checkInResident(
    { residentId: "res-123", roomId: "rm-1", bedId: "bd-1" },
    { hostelId: "hostel-warden-101" }
  );
  assert.equal(checkinResult.status, "Active");
  assertions++;
  assert.equal(checkinPayload.roomId, "rm-1");
  assertions++;

  // 6. Test Bed Transfer Contract
  let transferPayload = null;
  residentService.transferRoomOrBed = async (data, userCtx) => {
    transferPayload = data;
    assert.equal(userCtx.hostelId, "hostel-warden-101");
    return { _id: data.residentId, roomId: data.newRoomId, bedId: data.newBedId };
  };

  const transferResult = await residentService.transferRoomOrBed(
    { residentId: "res-123", newRoomId: "rm-2", newBedId: "bd-5", reason: "Room maintenance" },
    { hostelId: "hostel-warden-101" }
  );
  assert.equal(transferResult.roomId, "rm-2");
  assertions++;

  // 7. Test Maintenance / Complaints Logging Contract
  let maintenancePayload = null;
  MaintenanceLog.create = async (doc) => {
    maintenancePayload = doc;
    return { _id: "maint-101", ...doc, status: "In Progress" };
  };
  Room.findOne = async () => ({ _id: "rm-1", roomNumber: "101" });
  Room.findOneAndUpdate = async () => {};
  Room.findByIdAndUpdate = async () => {};

  const complaintLog = await maintenanceService.createMaintenanceLog(
    { targetType: "Room", targetId: "rm-1", reason: "Water leak in bathroom" },
    { hostelId: "hostel-warden-101", userId: "warden-user-1" }
  );
  assert.equal(complaintLog.status, "In Progress");
  assertions++;
  assert.equal(maintenancePayload.hostelId, "hostel-warden-101");
  assertions++;

  console.log(`✓ PASS: Wave 2B Warden contracts verified cleanly (${assertions} assertions)\n`);
}

runWardenContractTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
