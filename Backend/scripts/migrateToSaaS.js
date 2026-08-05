const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

// Imports models
const Owner = require("../models/Owner");
const Hostel = require("../models/Hostel");
const Workspace = require("../models/Workspace");
const Subscription = require("../models/Subscription");
const StorageUsage = require("../models/StorageUsage");
const Plan = require("../models/Plan");

async function migrate() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI not defined in environment.");
    process.exit(1);
  }

  console.log("Connecting to Database...");
  await mongoose.connect(uri);
  console.log("Connected to Database.");

  // Seeding plans just in case they aren't seeded yet
  console.log("Seeding workspace plans collection...");
  let basePlan = await Plan.findOne({ name: "base" });
  if (!basePlan) {
    basePlan = await Plan.create({
      name: "base",
      hostelLimit: 1,
      residentLimit: 100,
      staffLimit: 5,
      storageLimit: 5 * 1024 * 1024 * 1024,
      features: ["canUseStaff", "canUseFood", "canUseExpenses"],
      monthlyPrice: 1000,
    });
  }

  // Get all owners
  const owners = await Owner.find({});
  console.log(`Found ${owners.length} owners to migrate.`);

  // We will store modified state for manual rollback
  const createdWorkspaces = [];
  const createdSubscriptions = [];
  const createdStorages = [];
  const modifiedHostels = [];
  const modifiedOwners = [];

  try {
    for (const owner of owners) {
      if (owner.workspaceId) {
        console.log(`Owner ${owner.ownerName} (${owner.phone}) already has a workspace. Skipping.`);
        continue;
      }

      console.log(`Migrating Owner: ${owner.ownerName} (${owner.phone})...`);

      // 1. Create Workspace
      const workspaceName = owner.username ? `${owner.username}'s Workspace` : `${owner.ownerName}'s Workspace`;
      const workspace = new Workspace({
        name: workspaceName,
        ownerId: owner._id,
      });

      // Find all hostels for this owner
      const hostels = await Hostel.find({
        $or: [{ ownerId: owner._id }, { _id: owner.hostelId }],
      });

      if (hostels.length > 0) {
        workspace.activeHostelId = hostels[0]._id;
      }

      await workspace.save();
      createdWorkspaces.push(workspace);

      // 2. Create Subscription (BASE)
      const subscription = new Subscription({
        workspaceId: workspace._id,
        plan: "base",
        status: "Active",
        startedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        storageLimit: basePlan.storageLimit,
        residentLimit: basePlan.residentLimit,
        staffLimit: basePlan.staffLimit,
        hostelLimit: basePlan.hostelLimit,
        features: basePlan.features,
      });
      await subscription.save();
      createdSubscriptions.push(subscription);

      // 3. Create StorageUsage
      const storageUsage = new StorageUsage({
        workspaceId: workspace._id,
        usedBytes: 0,
        residentImages: 0,
        documents: 0,
        receipts: 0,
        exports: 0,
        otherFiles: 0,
        hostelBreakdown: hostels.map((h) => ({
          hostelId: h._id,
          usedBytes: 0,
        })),
      });
      await storageUsage.save();
      createdStorages.push(storageUsage);

      // Link them to workspace
      workspace.subscriptionId = subscription._id;
      workspace.storageId = storageUsage._id;
      await workspace.save();

      // 4. Update Hostels
      for (const hostel of hostels) {
        const originalHostelData = {
          _id: hostel._id,
          workspaceId: hostel.workspaceId,
          ownerId: hostel.ownerId,
        };
        hostel.workspaceId = workspace._id;
        hostel.ownerId = owner._id;
        await hostel.save();
        modifiedHostels.push({ hostel, originalHostelData });
      }

      // 5. Update Owner
      const originalOwnerData = {
        _id: owner._id,
        workspaceId: owner.workspaceId,
        activeWorkspaceId: owner.activeWorkspaceId,
        activeHostelId: owner.activeHostelId,
      };
      owner.workspaceId = workspace._id;
      owner.activeWorkspaceId = workspace._id;
      if (workspace.activeHostelId) {
        owner.activeHostelId = workspace.activeHostelId;
      }
      await owner.save();
      modifiedOwners.push({ owner, originalOwnerData });

      console.log(`Successfully migrated Owner ${owner.ownerName}.`);
    }

    console.log("Migration Phase 1 Completed successfully.");
    console.log("VERIFYING COUNTS:");
    const workspaceCount = await Workspace.countDocuments();
    const subCount = await Subscription.countDocuments({ workspaceId: { $ne: null } });
    console.log(`Total workspaces: ${workspaceCount}`);
    console.log(`Total workspace subscriptions: ${subCount}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed! Initiating rollback...", error);
    
    // Rollback Workspace creation
    for (const ws of createdWorkspaces) {
      await Workspace.deleteOne({ _id: ws._id });
    }
    // Rollback Subscriptions
    for (const sub of createdSubscriptions) {
      await Subscription.deleteOne({ _id: sub._id });
    }
    // Rollback Storage
    for (const storage of createdStorages) {
      await StorageUsage.deleteOne({ _id: storage._id });
    }
    // Rollback Hostels
    for (const item of modifiedHostels) {
      const h = item.hostel;
      h.workspaceId = item.originalHostelData.workspaceId;
      h.ownerId = item.originalHostelData.ownerId;
      await h.save();
    }
    // Rollback Owners
    for (const item of modifiedOwners) {
      const o = item.owner;
      o.workspaceId = item.originalOwnerData.workspaceId;
      o.activeWorkspaceId = item.originalOwnerData.activeWorkspaceId;
      o.activeHostelId = item.originalOwnerData.activeHostelId;
      await o.save();
    }

    console.log("Rollback completed.");
    process.exit(1);
  }
}

migrate();
