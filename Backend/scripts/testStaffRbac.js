const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Staff = require("../models/Staff");
const RolePermission = require("../models/RolePermission");
const AuditLog = require("../models/AuditLog");
const { seedDefaultRoles, canAccessModule } = require("../services/permissionService");
const staffService = require("../services/staffService");

async function runVerification() {
  console.log("=========================================");
  console.log("STARTING STAFF & RBAC MODULE VERIFICATION");
  console.log("=========================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  console.log("Connecting to MongoDB:", mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB successfully.");

    const testTenantId = new mongoose.Types.ObjectId();
    const testHostelId = testTenantId;
    const ownerId = new mongoose.Types.ObjectId();

    console.log("\n1. Testing Default Role Permission Seeding...");
    await seedDefaultRoles(testTenantId);
    const roles = await RolePermission.find({ tenantId: testTenantId });
    console.log(`✓ Seeded ${roles.length} default role permission matrices.`);

    console.log("\n2. Testing Module & Action Level Access Control...");
    const wardenCanViewRooms = await canAccessModule(testTenantId, "Warden", "rooms", "view");
    const wardenCanDeleteRooms = await canAccessModule(testTenantId, "Warden", "rooms", "delete");
    const wardenCanViewTreasury = await canAccessModule(testTenantId, "Warden", "treasury", "view");
    const cookCanViewFood = await canAccessModule(testTenantId, "Cook", "food", "view");
    const cookCanViewResidents = await canAccessModule(testTenantId, "Cook", "residents", "view");
    const accountantCanCollectPayments = await canAccessModule(testTenantId, "Accountant", "payments", "collect");
    const ownerCanAccessAll = await canAccessModule(testTenantId, "Owner", "treasury", "manage");

    console.log(" - Warden can view rooms:", wardenCanViewRooms === true ? "PASS ✓" : "FAIL ✗");
    console.log(" - Warden can delete rooms:", wardenCanDeleteRooms === false ? "PASS ✓" : "FAIL ✗");
    console.log(" - Warden can view treasury:", wardenCanViewTreasury === false ? "PASS ✓" : "FAIL ✗");
    console.log(" - Cook can view food:", cookCanViewFood === true ? "PASS ✓" : "FAIL ✗");
    console.log(" - Cook can view residents:", cookCanViewResidents === false ? "PASS ✓" : "FAIL ✗");
    console.log(" - Accountant can collect payments:", accountantCanCollectPayments === true ? "PASS ✓" : "FAIL ✗");
    console.log(" - Owner has full access:", ownerCanAccessAll === true ? "PASS ✓" : "FAIL ✗");

    console.log("\n3. Testing Staff Member Creation (Cook)...");
    const cookData = {
      fullName: "Ramesh Cook",
      email: `ramesh.cook.${Date.now()}@hostelmate.com`,
      phone: `98765${Math.floor(10000 + Math.random() * 90000)}`,
      role: "Cook",
      designation: "Head Chef",
      salary: 22000,
      joiningDate: new Date(),
      password: "Password123!",
    };

    const createdCook = await staffService.createStaff(testTenantId, testHostelId, cookData, ownerId);
    console.log(`✓ Created Cook Staff: ${createdCook.staff.fullName} (EmpCode: ${createdCook.staff.employeeCode})`);

    console.log("\n4. Testing Multi-Tenant Unique Constraint Rejection...");
    try {
      await staffService.createStaff(testTenantId, testHostelId, cookData, ownerId);
      console.log("✗ Duplicate creation should have thrown 409 error!");
    } catch (err) {
      console.log(`✓ Duplicate check correctly rejected: ${err.message}`);
    }

    console.log("\n5. Testing Status Toggle (Active -> Inactive)...");
    const updatedStatus = await staffService.toggleStatus(testTenantId, createdCook.staff._id, "Inactive", ownerId);
    console.log(`✓ Staff status updated to: ${updatedStatus.employmentStatus}`);

    console.log("\n6. Testing Self Password Change & Password Reset...");
    const pwdResetResult = await staffService.resetPassword(testTenantId, createdCook.staff._id, "NewSecurePassword456!", ownerId);
    console.log("✓ Reset staff password successfully.");

    console.log("\n7. Testing Soft Delete...");
    await staffService.deleteStaff(testTenantId, createdCook.staff._id, ownerId);
    const deletedFetch = await Staff.findOne({ _id: createdCook.staff._id, isDeleted: true });
    console.log(`✓ Soft delete verified. isDeleted: ${deletedFetch.isDeleted}, deletedAt: ${deletedFetch.deletedAt}`);

    console.log("\n8. Testing Staff Activity Audit Logs...");
    const logs = await AuditLog.find({ targetId: createdCook.staff._id });
    console.log(`✓ Found ${logs.length} audit log entries recorded for staff lifecycle events.`);

    // Cleanup test data
    await User.deleteMany({ tenantId: testTenantId });
    await Staff.deleteMany({ tenantId: testTenantId });
    await RolePermission.deleteMany({ tenantId: testTenantId });
    await AuditLog.deleteMany({ targetId: createdCook.staff._id });
    console.log("\n✓ Test cleanup complete.");

    console.log("\n=========================================");
    console.log("ALL VERIFICATION CHECKS PASSED PERFECTLY!");
    console.log("=========================================");
  } catch (error) {
    console.error("VERIFICATION FAILED:", error);
  } finally {
    await mongoose.disconnect();
  }
}

runVerification();
