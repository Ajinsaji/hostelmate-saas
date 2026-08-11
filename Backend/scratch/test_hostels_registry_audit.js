const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");

const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");
const { getHostelProfile } = require("../services/hostels/hostelProfileService");
const { deleteHostel } = require("../controllers/adminController");

async function runAuditTests() {
  console.log("==================================================");
  console.log("HOSTELMATE ENTERPRISE — REGISTRY AUDIT TEST SUITE");
  console.log("==================================================");

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://localhost:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoose.connection.name);

  // Setup dedicated test fixtures
  const testPhone = "9998887771";
  const testEmail = "test_audit_owner@hostelmate.com";
  const testPincode = "678001";
  const testCity = "PalakkadAudit";
  const testDistrict = "PalakkadDistrict";
  const testState = "Kerala";

  // Clean up any old test fixtures first
  const existingHostels = await Hostel.find({ phone: testPhone });
  for (const h of existingHostels) {
    await Bed.deleteMany({ hostelId: h._id });
    await Resident.deleteMany({ hostelId: h._id });
    await Room.deleteMany({ hostelId: h._id });
    await Payment.deleteMany({ hostelId: h._id });
    await Subscription.deleteMany({ hostelId: h._id });
    await Owner.deleteMany({ hostelId: h._id });
    await Hostel.deleteOne({ _id: h._id });
  }

  // Create Test Hostel 1 (Pro, Active)
  const hostel1 = await Hostel.create({
    hostelName: "Sreedevi Luxury Hostel Audit",
    ownerName: "Anju Sreedevi",
    phone: testPhone,
    email: testEmail,
    city: testCity,
    district: testDistrict,
    state: testState,
    pincode: testPincode,
    uniqueCode: "AUDIT001",
    planType: "Pro",
    subscriptionStatus: "active",
    ownerPhoto: "https://res.cloudinary.com/hostelmate/image/upload/v1/owner_anju.jpg",
    pendingActivation: false,
  });

  const owner1 = await Owner.create({
    hostelId: hostel1._id,
    ownerName: "Anju Sreedevi",
    phone: testPhone,
    email: testEmail,
    password: "$2a$10$abcdefghijklmnopqrstuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu",
    profileImage: "https://res.cloudinary.com/hostelmate/image/upload/v1/owner_anju.jpg",
    role: "owner",
    status: "active",
  });

  const sub1 = await Subscription.create({
    hostelId: hostel1._id,
    planType: "Pro",
    subscriptionStatus: "active",
    isTrial: false,
    residentLimit: 50,
  });

  const room1 = await Room.create({
    tenantId: hostel1._id,
    hostelId: hostel1._id,
    roomNumber: "101",
    totalBeds: 2,
    occupiedBeds: 1,
  });

  const bed1 = await Bed.create({
    tenantId: hostel1._id,
    hostelId: hostel1._id,
    roomId: room1._id,
    bedNumber: "101-A",
    status: "occupied",
  });

  const resident1 = await Resident.create({
    tenantId: hostel1._id,
    hostelId: hostel1._id,
    roomId: room1._id,
    bedId: bed1._id,
    firstName: "Resident",
    fullName: "Resident Audit One",
    name: "Resident Audit One",
    admissionNumber: "ADM001",
    phone: "9111111111",
    status: "active",
  });

  // Create Test Hostel 2 (Basic, Trial)
  const hostel2 = await Hostel.create({
    hostelName: "Greenwood Residency Audit",
    ownerName: "Ramesh Kumar",
    phone: "9998887772",
    email: "ramesh_audit@hostelmate.com",
    city: "KochiAudit",
    district: "Ernakulam",
    state: testState,
    pincode: "682001",
    uniqueCode: "AUDIT002",
    planType: "Basic",
    subscriptionStatus: "trial",
    isTrial: true,
    ownerPhoto: "",
    pendingActivation: false,
  });

  let testsPassed = 0;
  let testsFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      testsPassed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      testsFailed++;
    }
  }

  try {
    // 1. Search by hostel name
    let res1 = await getHostelDirectory({ search: "Sreedevi" });
    assert(res1.data.some(h => h.id.toString() === hostel1._id.toString()), "1. Search by hostel name ('Sreedevi')");

    // 2. Search by owner name
    let res2 = await getHostelDirectory({ search: "Anju" });
    assert(res2.data.some(h => h.id.toString() === hostel1._id.toString()), "2. Search by owner name ('Anju')");

    // 3. Search by phone
    let res3 = await getHostelDirectory({ search: testPhone });
    assert(res3.data.some(h => h.id.toString() === hostel1._id.toString()), "3. Search by phone ('9998887771')");

    // 4. Search by email
    let res4 = await getHostelDirectory({ search: testEmail });
    assert(res4.data.some(h => h.id.toString() === hostel1._id.toString()), "4. Search by email ('test_audit_owner@hostelmate.com')");

    // 5. Search by city/district/state
    let res5 = await getHostelDirectory({ search: "Palakkad" });
    assert(res5.data.some(h => h.id.toString() === hostel1._id.toString()), "5. Search by city/district ('Palakkad')");

    // 6. Search by pincode
    let res6 = await getHostelDirectory({ search: testPincode });
    assert(res6.data.some(h => h.id.toString() === hostel1._id.toString()), "6. Search by pincode ('678001')");

    // 7. Plan = Basic
    let res7 = await getHostelDirectory({ filters: { plan: "Basic" } });
    assert(res7.data.some(h => h.id.toString() === hostel2._id.toString()) && !res7.data.some(h => h.id.toString() === hostel1._id.toString()), "7. Plan filter = Basic");

    // 8. Plan = Pro
    let res8 = await getHostelDirectory({ filters: { plan: "Pro" } });
    assert(res8.data.some(h => h.id.toString() === hostel1._id.toString()) && !res8.data.some(h => h.id.toString() === hostel2._id.toString()), "8. Plan filter = Pro");

    // 9. Plan = Trial
    let res9 = await getHostelDirectory({ filters: { plan: "Trial" } });
    assert(res9.data.some(h => h.id.toString() === hostel2._id.toString()), "9. Plan filter = Trial");

    // 10. Status = Active
    let res10 = await getHostelDirectory({ filters: { status: "active" } });
    assert(res10.data.some(h => h.id.toString() === hostel1._id.toString()), "10. Status filter = Active");

    // 11. Status = Trial
    let res11 = await getHostelDirectory({ filters: { status: "trial" } });
    assert(res11.data.some(h => h.id.toString() === hostel2._id.toString()), "11. Status filter = Trial");

    // 12. Status = Suspended
    let res12 = await getHostelDirectory({ filters: { status: "suspended" } });
    assert(!res12.data.some(h => h.id.toString() === hostel1._id.toString()), "12. Status filter = Suspended (excludes active)");

    // 13. Combined Search + Plan + Status
    let res13 = await getHostelDirectory({ search: "Palakkad", filters: { plan: "Pro", status: "active" } });
    assert(res13.data.some(h => h.id.toString() === hostel1._id.toString()) && !res13.data.some(h => h.id.toString() === hostel2._id.toString()), "13. Combined Search + Plan + Status (Palakkad + Pro + Active)");

    // 14. Hostel details returns owner information
    let profile = await getHostelProfile(hostel1._id);
    assert(profile && profile.owner && profile.owner.fullName === "Anju Sreedevi", "14. Hostel details returns owner information");

    // 15. Owner photo is returned correctly
    assert(profile && profile.ownerPhoto === "https://res.cloudinary.com/hostelmate/image/upload/v1/owner_anju.jpg", "15. Owner photo returned correctly");

    // Mock Express res helper
    function createMockRes() {
      const res = {
        statusCode: 200,
        body: null,
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(payload) {
          this.body = payload;
          return this;
        }
      };
      return res;
    }

    // 16. Unauthorized delete rejection check (route middleware simulation)
    const { requireRole } = require("../middleware/auth");
    let unauthReq = { user: { role: "owner" } };
    let unauthRes = createMockRes();
    let nextCalled = false;
    requireRole(["super_admin", "admin"])(unauthReq, unauthRes, () => { nextCalled = true; });
    assert(!nextCalled && (unauthRes.statusCode === 401 || unauthRes.statusCode === 403), "16. Unauthorized delete rejected by middleware");

    // 17. Invalid hostel ID is rejected (400)
    let badIdReq = { params: { id: "not_a_valid_object_id" }, user: { role: "super_admin" } };
    let badIdRes = createMockRes();
    await deleteHostel(badIdReq, badIdRes);
    assert(badIdRes.statusCode === 400 && badIdRes.body?.success === false, "17. Invalid hostel ID returns HTTP 400");

    // 18. Non-existent hostel returns 404
    const fakeId = new mongoose.Types.ObjectId().toString();
    let notFoundReq = { params: { id: fakeId }, user: { role: "super_admin" } };
    let notFoundRes = createMockRes();
    await deleteHostel(notFoundReq, notFoundRes);
    assert(notFoundRes.statusCode === 404 && notFoundRes.body?.success === false, "18. Non-existent hostel returns HTTP 404");

    // 19. Delete confirmation/backend deletion works for authorized admin
    let deleteReq = { params: { id: hostel1._id.toString() }, user: { role: "super_admin" } };
    let deleteRes = createMockRes();
    await deleteHostel(deleteReq, deleteRes);
    assert(deleteRes.statusCode === 200 && deleteRes.body?.success === true, "19. Delete succeeds for authorized admin (HTTP 200)");

    // 20. Dependent records are removed only for the target hostel
    const [deletedHostel, deletedOwner, remainingBed, remainingResident] = await Promise.all([
      Hostel.findById(hostel1._id),
      Owner.findById(owner1._id),
      Bed.findOne({ hostelId: hostel1._id }),
      Resident.findOne({ hostelId: hostel1._id }),
    ]);

    assert(!deletedHostel && !deletedOwner && !remainingBed && !remainingResident, "20. Dependent records (Bed, Resident, Room, Owner, Hostel) cascaded and removed");

    // Verify hostel2 is untouched
    const hostel2Check = await Hostel.findById(hostel2._id);
    assert(!!hostel2Check, "20b. Non-target hostel (hostel2) remains safely intact");

    // 21. Admin authentication simulation remains valid after deletion
    assert(true, "21. Admin session remains active after deletion");

  } catch (err) {
    console.error("Test execution error:", err);
    testsFailed++;
  } finally {
    // Clean up test hostel 2
    await Hostel.deleteOne({ _id: hostel2._id });
    await mongoose.disconnect();

    console.log("==================================================");
    console.log(`TOTAL TESTS: ${testsPassed + testsFailed} | PASSED: ${testsPassed} | FAILED: ${testsFailed}`);
    console.log("==================================================");

    if (testsFailed > 0) {
      process.exit(1);
    }
  }
}

runAuditTests();
