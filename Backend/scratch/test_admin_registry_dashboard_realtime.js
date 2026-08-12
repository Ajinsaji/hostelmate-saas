const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");
const Subscription = require("../models/Subscription");
const Payment = require("../models/Payment");
const { getDashboardOverview } = require("../services/dashboard/overviewService");
const { getRevenueMetrics } = require("../services/dashboard/revenueService");
const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");

async function runRealtimeControlledTest() {
  console.log("=== STARTING ADMIN REGISTRY & DASHBOARD REALTIME CONTROLLED TEST ===");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  try {
    // 1. Initial DB State Audit
    const initialOverview = await getDashboardOverview();
    const initialRevenue = await getRevenueMetrics();
    console.log("\n[1] INITIAL STATE AUDIT:");
    console.log("Active Hostels Count:", initialOverview.activeHostels);
    console.log("Total Hostels Count:", initialOverview.totalHostels);
    console.log("Trash Hostels Count:", initialOverview.deletedHostels);
    console.log("Monthly Revenue:", initialRevenue.monthlyRevenue);

    // 2. Create Test Hostel
    console.log("\n[2] CREATING TEST HOSTEL...");
    const testHostel = await Hostel.create({
      hostelName: "Realtime Test Haven",
      ownerName: "Realtime Owner",
      phone: "9999888877",
      email: "realtime@test.com",
      city: "Palakkad",
      district: "Palakkad",
      state: "Kerala",
      pincode: "678001",
      address: "123 Main St, Palakkad",
      pendingActivation: false,
      subscriptionStatus: "active",
      planType: "Pro",
      isDeleted: false,
    });

    const overviewAfterCreate = await getDashboardOverview();
    console.log("Active Hostels after creation:", overviewAfterCreate.activeHostels);
    if (overviewAfterCreate.activeHostels !== initialOverview.activeHostels + 1) {
      throw new Error(`Expected active hostels to increase from ${initialOverview.activeHostels} to ${initialOverview.activeHostels + 1}, got ${overviewAfterCreate.activeHostels}`);
    }
    console.log("✅ Active Hostels count updated dynamically on creation!");

    // 3. Record Payment & Check Revenue
    console.log("\n[3] RECORDING PAYMENT FOR TEST HOSTEL...");
    const testPayment = await Payment.create({
      hostelId: testHostel._id,
      totalRent: 1500,
      amount: 1500,
      paidAmount: 1500,
      status: "success",
      paymentMethod: "online",
      transactionId: `TXN_${Date.now()}`,
    });

    const revenueAfterPayment = await getRevenueMetrics();
    console.log("Monthly Revenue after payment:", revenueAfterPayment.monthlyRevenue);
    if (revenueAfterPayment.monthlyRevenue < initialRevenue.monthlyRevenue + 1500) {
      throw new Error("Expected monthly revenue to reflect the newly recorded payment!");
    }
    console.log("✅ Revenue metric updated dynamically from actual payment records!");

    // 4. Soft Delete (Move to Trash)
    console.log("\n[4] SOFT DELETING HOSTEL TO TRASH...");
    testHostel.isDeleted = true;
    testHostel.deletedAt = new Date();
    await testHostel.save();

    const overviewAfterTrash = await getDashboardOverview();
    console.log("Active Hostels after soft delete:", overviewAfterTrash.activeHostels);
    console.log("Trash Hostels after soft delete:", overviewAfterTrash.deletedHostels);

    if (overviewAfterTrash.activeHostels !== initialOverview.activeHostels) {
      throw new Error(`Expected active hostels to decrease back to ${initialOverview.activeHostels}, got ${overviewAfterTrash.activeHostels}`);
    }
    if (overviewAfterTrash.deletedHostels !== initialOverview.deletedHostels + 1) {
      throw new Error("Expected trash count to increase by 1!");
    }
    console.log("✅ Soft deletion updated active & trash counts correctly!");

    // 4b. Verify Payment Records Preserved
    const preservedPayments = await Payment.find({ hostelId: testHostel._id });
    if (preservedPayments.length === 0) {
      throw new Error("CRITICAL SAFETY FAILURE: Soft deleting hostel wiped payment records!");
    }
    console.log("✅ Payment records remain 100% preserved during soft deletion!");

    // 5. Restore Hostel from Trash
    console.log("\n[5] RESTORING HOSTEL FROM TRASH...");
    testHostel.isDeleted = false;
    testHostel.deletedAt = null;
    await testHostel.save();

    const overviewAfterRestore = await getDashboardOverview();
    console.log("Active Hostels after restore:", overviewAfterRestore.activeHostels);
    console.log("Trash Hostels after restore:", overviewAfterRestore.deletedHostels);

    if (overviewAfterRestore.activeHostels !== initialOverview.activeHostels + 1) {
      throw new Error("Expected active hostels count to increase after restore!");
    }
    console.log("✅ Restoring hostel updated counts correctly!");

    // 6. Registry Search & Filter Verification
    console.log("\n[6] VERIFYING REGISTRY SEARCH & FILTERS...");
    const searchRes = await getHostelDirectory({ search: "Palakkad", filters: { plan: "Pro", status: "active" } });
    console.log("Search 'Palakkad' + Pro + Active results count:", searchRes.data.length);
    const foundTestHostel = searchRes.data.find(h => String(h.id) === String(testHostel._id));
    if (!foundTestHostel) {
      throw new Error("Registry search failed to locate test hostel with combined filters!");
    }
    console.log("✅ Search & Filters returned exact matching database record!");

    // Clean up test records safely
    await Payment.findByIdAndDelete(testPayment._id);
    await Hostel.findByIdAndDelete(testHostel._id);
    console.log("\n[7] CLEANUP COMPLETE!");

    console.log("\n=======================================================");
    console.log("🎉 ALL REALTIME CONTROLLED ACCEPTANCE TESTS PASSED!");
    console.log("=======================================================");
  } catch (err) {
    console.error("\n❌ TEST FAILED:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runRealtimeControlledTest();
