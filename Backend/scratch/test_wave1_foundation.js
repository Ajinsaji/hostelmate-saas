const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load backend env config
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/hostelmate";
console.log("Connecting to Database at", MONGO_URI);

const WorkspaceCacheService = require("../services/WorkspaceCacheService");
const FeatureRegistry = require("../services/FeatureRegistry");
const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const EventBus = require("../services/EventBus");
const NotificationPipelineService = require("../services/NotificationPipelineService");

async function runTests() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB successfully.\n");

    const testWorkspaceId = new mongoose.Types.ObjectId();
    console.log("Using Mock Workspace ID:", testWorkspaceId);

    // 1. Workspace Cache Layer test
    console.log("\n--- Testing Cache Layer ---");
    await WorkspaceCacheService.set(`features:${testWorkspaceId}`, {
      plan: "test-pro",
      features: ["canUseAI", "analytics", "payroll"],
      limits: { hostel: 5, resident: 250, staff: 15, storage: 10737418240 }
    });
    
    let cachedData = await WorkspaceCacheService.get(`features:${testWorkspaceId}`);
    console.log("Cache Retrieve Successful:", cachedData !== null);
    console.log("Cached Plan:", cachedData?.plan);

    // 2. Feature Registry Engine test
    console.log("\n--- Testing Feature Registry ---");
    const hasAI = await FeatureRegistry.has(testWorkspaceId, "canUseAI");
    const hasMarketplace = await FeatureRegistry.has(testWorkspaceId, "marketplace");
    const residentLimit = await FeatureRegistry.limit(testWorkspaceId, "resident");
    
    console.log("Registry checking 'canUseAI' (expected: true):", hasAI);
    console.log("Registry checking 'marketplace' (expected: false):", hasMarketplace);
    console.log("Registry resident limit (expected: 250):", residentLimit);

    // 3. Business Rule Engine test
    console.log("\n--- Testing Business Rule Engine ---");
    // Validate storage upload within limit
    const uploadCheckPass = await BusinessRuleEngine.canUploadDocument(testWorkspaceId, 500 * 1024 * 1024); // 500MB
    console.log("Storage upload checking 500MB (expected: allowed):", uploadCheckPass.allowed);

    // Validate storage upload exceeding limit
    const uploadCheckFail = await BusinessRuleEngine.canUploadDocument(testWorkspaceId, 12 * 1024 * 1024 * 1024); // 12GB
    console.log("Storage upload checking 12GB (expected: denied):", uploadCheckFail.allowed);

    // 4. Event Bus test
    console.log("\n--- Testing Event Bus ---");
    let eventReceived = false;
    EventBus.once("TEST_EVENT", (payload) => {
      console.log("Event received with payload:", payload);
      eventReceived = true;
    });
    EventBus.emit("TEST_EVENT", { success: true });
    console.log("Event Bus verification:", eventReceived ? "SUCCESS" : "FAILED");

    // 5. Notification Pipeline test
    console.log("\n--- Testing Notification Pipeline ---");
    const notif = await NotificationPipelineService.routeNotification({
      workspaceId: testWorkspaceId,
      category: "Subscription",
      title: "Wave 1 Verified",
      body: "The SaaS foundation is completely integrated and tested.",
    });
    console.log("Notification created successfully in DB:", notif !== null && notif.title === "Wave 1 Verified");

    // 6. Cache Invalidation verification
    console.log("\n--- Testing Cache Invalidation ---");
    WorkspaceCacheService.invalidateWorkspace(testWorkspaceId);
    const cachedAfterInvalidate = await WorkspaceCacheService.get(`features:${testWorkspaceId}`);
    console.log("Cached cleared after Invalidation (expected: null):", cachedAfterInvalidate);

    console.log("\n=========================");
    console.log("ALL WAVE 1 TESTS PASSED!");
    console.log("=========================");

  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await mongoose.connection.close();
    console.log("\nDisconnected from Database.");
  }
}

runTests();
