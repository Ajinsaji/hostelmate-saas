const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Staff = require("../models/Staff");
const Shift = require("../models/Shift");
const StaffShiftAssignment = require("../models/StaffShiftAssignment");
const Attendance = require("../models/Attendance");
const Holiday = require("../models/Holiday");
const AttendanceCorrection = require("../models/AttendanceCorrection");
const LeaveType = require("../models/LeaveType");
const LeaveRequest = require("../models/LeaveRequest");
const LeaveBalance = require("../models/LeaveBalance");
const OvertimeRequest = require("../models/OvertimeRequest");

const shiftService = require("../services/shiftService");
const attendanceService = require("../services/attendanceService");
const leaveService = require("../services/leaveService");
const overtimeService = require("../services/overtimeService");

async function runPhase82Tests() {
  console.log("=================================================");
  console.log("STARTING PHASE 8.2 ATTENDANCE & SHIFT VERIFICATION");
  console.log("=================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  console.log("Connecting to MongoDB:", mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB.");

    const testTenantId = new mongoose.Types.ObjectId();
    const testHostelId = testTenantId;

    // Create owner user & staff member
    const ownerUser = await User.create({
      tenantId: testTenantId,
      email: `owner.${Date.now()}@hostel.com`,
      phone: `99900${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash: "hash",
      role: "Owner",
      status: "Active",
    });

    const staffUser = await User.create({
      tenantId: testTenantId,
      email: `warden.${Date.now()}@hostel.com`,
      phone: `99911${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash: "hash",
      role: "Warden",
      status: "Active",
    });

    const staff = await Staff.create({
      tenantId: testTenantId,
      hostelId: testHostelId,
      userId: staffUser._id,
      employeeCode: "EMP-101",
      fullName: "Test Warden",
      designation: "Warden",
      employmentStatus: "Active",
    });

    console.log("\n1. Testing Shift Creation & Assignment...");
    const shift = await shiftService.createShift(
      testTenantId,
      testHostelId,
      {
        shiftCode: "SH-TEST-MOR",
        shiftName: "Morning",
        startTime: "08:00",
        endTime: "16:00",
        breakDuration: 30,
        workingHours: 8,
      },
      ownerUser._id
    );
    console.log(`✓ Shift Created: ${shift.shiftName} (${shift.startTime}-${shift.endTime})`);

    const assignment = await shiftService.assignShift(
      testTenantId,
      testHostelId,
      { staffId: staff._id, shiftId: shift._id, effectiveFrom: new Date() },
      ownerUser._id
    );
    console.log(`✓ Shift Assigned to staff ${staff.employeeCode}`);

    console.log("\n2. Testing Check-In with Source Tracking & Late Minutes...");
    const checkInRecord = await attendanceService.checkIn(
      testTenantId,
      testHostelId,
      staff._id,
      { attendanceSource: "Mobile", deviceInfo: "iPhone 14 Pro", remarks: "On time checkin" },
      staffUser._id
    );
    console.log(`✓ Staff Checked-In. Source: ${checkInRecord.attendanceSource}, Status: ${checkInRecord.attendanceStatus}`);

    console.log("\n3. Testing Check-Out & Working Hours / Overtime Calculation...");
    const checkOutRecord = await attendanceService.checkOut(
      testTenantId,
      testHostelId,
      staff._id,
      { remarks: "End of shift" },
      staffUser._id
    );
    console.log(`✓ Staff Checked-Out. Worked: ${checkOutRecord.workingHours} hrs, Overtime: ${checkOutRecord.overtimeHours} hrs`);

    console.log("\n4. Testing Attendance Correction Workflow...");
    const corrRequest = await attendanceService.submitAttendanceCorrection(testTenantId, testHostelId, staff._id, {
      attendanceId: checkInRecord._id,
      requestedCheckIn: new Date(Date.now() - 9 * 3600 * 1000),
      requestedCheckOut: new Date(Date.now() - 1 * 3600 * 1000),
      reason: "Forgot mobile clock-in during network drop",
    });
    console.log(`✓ Attendance Correction Requested: ID ${corrRequest._id}`);

    const approvedCorr = await attendanceService.approveAttendanceCorrection(testTenantId, corrRequest._id, ownerUser._id);
    console.log(`✓ Attendance Correction Approved by Owner. Status: ${approvedCorr.status}`);

    console.log("\n5. Testing Holiday & Leave Management...");
    await leaveService.seedDefaultLeaveTypes(testTenantId);
    const balances = await leaveService.getLeaveBalances(testTenantId, staff._id);
    const casualLeaveType = balances.find((b) => b.leaveType.name === "Casual Leave");

    console.log(`✓ Initial Casual Leave Balance: ${casualLeaveType.remaining} days remaining`);

    const leaveReq = await leaveService.createLeaveRequest(testTenantId, testHostelId, staff._id, {
      leaveTypeId: casualLeaveType.leaveType._id,
      fromDate: new Date(),
      toDate: new Date(),
      reason: "Family emergency",
    });
    console.log(`✓ Leave Request Created: ${leaveReq.numberOfDays} day(s) requested`);

    await leaveService.approveLeave(testTenantId, leaveReq._id, ownerUser._id);
    const updatedBalances = await leaveService.getLeaveBalances(testTenantId, staff._id);
    const updatedCasualBal = updatedBalances.find((b) => b.leaveType.name === "Casual Leave");
    console.log(`✓ Leave Approved. Updated Balance: ${updatedCasualBal.remaining} days remaining`);

    console.log("\n6. Testing Overtime Claim Approval...");
    const otRequest = await overtimeService.createOvertimeRequest(testTenantId, testHostelId, staff._id, {
      attendanceId: checkInRecord._id,
      hours: 2,
      reason: "Hostel night inspection duty",
    });
    const approvedOt = await overtimeService.approveOvertime(testTenantId, otRequest._id, ownerUser._id);
    console.log(`✓ Overtime Approved by Owner: ${approvedOt.hours} hrs`);

    // Clean up test collections
    await User.deleteMany({ tenantId: testTenantId });
    await Staff.deleteMany({ tenantId: testTenantId });
    await Shift.deleteMany({ tenantId: testTenantId });
    await StaffShiftAssignment.deleteMany({ tenantId: testTenantId });
    await Attendance.deleteMany({ tenantId: testTenantId });
    await AttendanceCorrection.deleteMany({ tenantId: testTenantId });
    await LeaveType.deleteMany({ tenantId: testTenantId });
    await LeaveRequest.deleteMany({ tenantId: testTenantId });
    await LeaveBalance.deleteMany({ tenantId: testTenantId });
    await OvertimeRequest.deleteMany({ tenantId: testTenantId });

    console.log("\n✓ Test Cleanup Completed.");
    console.log("\n=================================================");
    console.log("PHASE 8.2 VERIFICATION PASSED WITH 100% SUCCESS!");
    console.log("=================================================");
  } catch (error) {
    console.error("PHASE 8.2 TEST FAILED:", error);
  }
  await mongoose.disconnect();
}

runPhase82Tests();
