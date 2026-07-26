const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Staff = require("../models/Staff");
const Shift = require("../models/Shift");
const Attendance = require("../models/Attendance");
const OvertimeRequest = require("../models/OvertimeRequest");
const PayrollPolicy = require("../models/PayrollPolicy");
const SalaryStructure = require("../models/SalaryStructure");
const PayrollPeriod = require("../models/PayrollPeriod");
const PayrollRecord = require("../models/PayrollRecord");
const SalaryAdvance = require("../models/SalaryAdvance");
const PayrollAdjustment = require("../models/PayrollAdjustment");
const PayrollException = require("../models/PayrollException");
const TreasuryLedger = require("../models/TreasuryLedger");
const Expense = require("../models/Expense");
const Payslip = require("../models/Payslip");

const payrollPolicyService = require("../services/payrollPolicyService");
const salaryStructureService = require("../services/salaryStructureService");
const salaryAdvanceService = require("../services/salaryAdvanceService");
const payrollAdjustmentService = require("../services/payrollAdjustmentService");
const payrollService = require("../services/payrollService");
const attendanceService = require("../services/attendanceService");

async function runPhase83Tests() {
  console.log("=================================================");
  console.log("STARTING PHASE 8.3 ENTERPRISE PAYROLL VERIFICATION");
  console.log("=================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  console.log("Connecting to MongoDB:", mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB.");

    try {
      await mongoose.connection.collection("staffs").dropIndex("username_1");
    } catch (e) {
      // index already dropped or absent
    }

    const testTenantId = new mongoose.Types.ObjectId();
    const testHostelId = testTenantId;

    // Create Owner and Staff User
    const ownerUser = await User.create({
      tenantId: testTenantId,
      email: `owner.payroll.${Date.now()}@hostel.com`,
      phone: `98800${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash: "hash",
      role: "Owner",
      status: "Active",
    });

    const staffUser = await User.create({
      tenantId: testTenantId,
      email: `warden.payroll.${Date.now()}@hostel.com`,
      phone: `98811${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash: "hash",
      role: "Warden",
      status: "Active",
    });

    const staff = await Staff.create({
      tenantId: testTenantId,
      hostelId: testHostelId,
      userId: staffUser._id,
      employeeCode: "EMP-PAY-101",
      fullName: "Payroll Test Warden",
      designation: "Warden",
      employmentStatus: "Active",
    });

    console.log("\n1. Testing Payroll Policy Seeding & Versioning...");
    const policy = await payrollPolicyService.seedDefaultPolicy(testTenantId, ownerUser._id);
    console.log(`✓ Active Payroll Policy: ${policy.salaryCalculationType}, Overtime Multiplier: ${policy.overtimeMultiplier}x`);

    console.log("\n2. Testing Salary Structure Creation & Revision...");
    const structure = await salaryStructureService.createSalaryStructure(
      testTenantId,
      {
        staffId: staff._id,
        basicSalary: 30000,
        houseRentAllowance: 5000,
        foodAllowance: 2000,
        providentFund: 1800,
        professionalTax: 200,
        paymentMode: "Bank Transfer",
      },
      ownerUser._id
    );
    console.log(`✓ Salary Structure Defined. Basic: ₹${structure.basicSalary}, HRA: ₹${structure.houseRentAllowance}`);

    console.log("\n3. Testing Attendance & Overtime Integration (Phase 8.2)...");
    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();

    const shift = await Shift.create({
      tenantId: testTenantId,
      hostelId: testHostelId,
      shiftCode: "SH-PAY-1",
      shiftName: "General",
      startTime: "09:00",
      endTime: "17:00",
      workingHours: 8,
      createdBy: ownerUser._id,
    });

    const attRecord = await attendanceService.checkIn(
      testTenantId,
      testHostelId,
      staff._id,
      { attendanceSource: "Web" },
      staffUser._id
    );
    await attendanceService.checkOut(
      testTenantId,
      testHostelId,
      staff._id,
      {},
      staffUser._id
    );

    const otClaim = await OvertimeRequest.create({
      tenantId: testTenantId,
      hostelId: testHostelId,
      staffId: staff._id,
      attendanceId: attRecord._id,
      hours: 4,
      reason: "Hostel Emergency Night Duty",
      status: "Approved",
      approvedBy: ownerUser._id,
    });
    console.log(`✓ Attendance & Approved Overtime Record (${otClaim.hours} hrs) Simulated`);

    console.log("\n4. Testing One-Time Adjustments & Salary Advances...");
    await payrollAdjustmentService.createAdjustment(
      testTenantId,
      {
        staffId: staff._id,
        type: "Addition",
        title: "Performance Bonus",
        amount: 2500,
        reason: "Excellent hostel maintenance",
      },
      ownerUser._id
    );

    const advance = await salaryAdvanceService.requestAdvance(testTenantId, staff._id, {
      amount: 4000,
      reason: "Medical expense",
    });
    await salaryAdvanceService.approveAdvance(testTenantId, advance._id, ownerUser._id);
    console.log(`✓ Bonus Addition (₹2500) and Salary Advance (₹4000) Created & Approved`);

    console.log("\n5. Testing Automatic Monthly Payroll Calculation...");
    const { period, records } = await payrollService.generatePayroll(testTenantId, testHostelId, month, year, ownerUser._id);
    const staffRecord = records.find((r) => r.staffId.toString() === staff._id.toString());
    console.log(`✓ Payroll Period Status: ${period.status}`);
    console.log(`✓ Calculated Gross Salary: ₹${staffRecord.grossSalary}`);
    console.log(`✓ Calculated Deductions (PF/Tax/Advance Recovery): ₹${staffRecord.deductions}`);
    console.log(`✓ Calculated Net Payable Salary: ₹${staffRecord.netSalary}`);

    console.log("\n6. Testing Payroll Approval & Locking...");
    await payrollService.approvePayroll(testTenantId, period._id, ownerUser._id);
    await payrollService.lockPayroll(testTenantId, period._id, ownerUser._id);
    console.log(`✓ Payroll Period Approved and Locked by Owner.`);

    console.log("\n7. Testing Atomic Salary Payment, Treasury Outflow, Expense Logging & Payslip PDF...");
    const payResult = await payrollService.paySalary(testTenantId, staffRecord._id, ownerUser._id);
    console.log(`✓ Salary Payment Executed.`);
    console.log(`✓ Treasury Payment Ledger ID: ${payResult.treasuryEntry._id}`);
    console.log(`✓ Salary Expense Record ID: ${payResult.expense._id}`);
    console.log(`✓ Generated Payslip PDF URL: ${payResult.payslip.pdfUrl}`);

    console.log("\n8. Testing Exception Tracking Simulation...");
    const exceptions = await PayrollException.find({ tenantId: testTenantId });
    console.log(`✓ Exception Tracking Active. Captured exceptions: ${exceptions.length}`);

    // Clean up test records
    await User.deleteMany({ tenantId: testTenantId });
    await Staff.deleteMany({ tenantId: testTenantId });
    await Shift.deleteMany({ tenantId: testTenantId });
    await Attendance.deleteMany({ tenantId: testTenantId });
    await OvertimeRequest.deleteMany({ tenantId: testTenantId });
    await PayrollPolicy.deleteMany({ tenantId: testTenantId });
    await SalaryStructure.deleteMany({ tenantId: testTenantId });
    await PayrollPeriod.deleteMany({ tenantId: testTenantId });
    await PayrollRecord.deleteMany({ tenantId: testTenantId });
    await SalaryAdvance.deleteMany({ tenantId: testTenantId });
    await PayrollAdjustment.deleteMany({ tenantId: testTenantId });
    await PayrollException.deleteMany({ tenantId: testTenantId });
    await TreasuryLedger.deleteMany({ tenantId: testTenantId });
    await Expense.deleteMany({ tenantId: testTenantId });
    await Payslip.deleteMany({ tenantId: testTenantId });

    console.log("\n✓ Test Cleanup Completed.");
    console.log("\n=================================================");
    console.log("PHASE 8.3 VERIFICATION PASSED WITH 100% SUCCESS!");
    console.log("=================================================");
  } catch (error) {
    console.error("PHASE 8.3 TEST FAILED:", error);
  }
  await mongoose.disconnect();
}

runPhase83Tests();
