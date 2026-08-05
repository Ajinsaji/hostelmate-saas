const Subscription = require("../models/Subscription");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Staff = require("../models/Staff");
const Plan = require("../models/Plan");
const StorageUsage = require("../models/StorageUsage");

class FeatureGateService {
  /**
   * Helper to retrieve subscription and its plan details for a workspace
   */
  async getSubscriptionContext(workspaceId) {
    let subscription = await Subscription.findOne({ workspaceId });
    if (!subscription) {
      // Fallback/Legacy trial support
      return {
        planName: "base",
        features: ["canUseStaff", "canUseFood", "canUseExpenses"],
        limits: {
          hostelLimit: 1,
          residentLimit: 100,
          staffLimit: 5,
          storageLimit: 5 * 1024 * 1024 * 1024,
        },
      };
    }

    // Load limits dynamically from the Plan collection
    const planName = subscription.plan || "base";
    const planLimits = await Plan.findOne({ name: planName });
    const limits = planLimits || {
      hostelLimit: subscription.hostelLimit || 1,
      residentLimit: subscription.residentLimit || 100,
      staffLimit: subscription.staffLimit || 5,
      storageLimit: subscription.storageLimit || 5 * 1024 * 1024 * 1024,
    };

    return {
      planName,
      features: planLimits ? planLimits.features : (subscription.features || []),
      limits: {
        hostelLimit: limits.hostelLimit,
        residentLimit: limits.residentLimit,
        staffLimit: limits.staffLimit,
        storageLimit: limits.storageLimit,
      },
    };
  }

  /**
   * General-purpose feature limit gate
   */
  async checkQuota(workspaceId, featureCode, limitKey, getUsedCountFn) {
    const context = await this.getSubscriptionContext(workspaceId);
    
    // Check if the plan actually supports this feature code
    const isFeatureAllowed = context.features.includes(featureCode);
    if (!isFeatureAllowed && featureCode !== null) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        message: `Your current plan (${context.planName}) does not support this feature.`,
      };
    }

    const limitValue = context.limits[limitKey] || 0;
    const usedValue = await getUsedCountFn();
    const remaining = Math.max(0, limitValue - usedValue);
    const allowed = limitValue === 999999 || usedValue < limitValue;

    return {
      allowed,
      limit: limitValue === 999999 ? "Unlimited" : limitValue,
      used: usedValue,
      remaining: limitValue === 999999 ? "Unlimited" : remaining,
      message: allowed ? null : `Limit reached. Max allowed is ${limitValue}. Please upgrade your plan.`,
    };
  }

  // Helper helper: get hostel IDs for workspace
  async getHostelIds(workspaceId) {
    const hostels = await Hostel.find({ workspaceId }).select("_id");
    return hostels.map((h) => h._id);
  }

  // 1. Can add Hostel
  async canAddHostel(workspaceId) {
    return this.checkQuota(workspaceId, null, "hostelLimit", async () => {
      const hostels = await Hostel.find({ workspaceId });
      return hostels.length;
    });
  }

  // 2. Can manage multiple hostels
  async canManageMultipleHostels(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.limits.hostelLimit > 1 || context.limits.hostelLimit === 999999;
    return {
      allowed,
      limit: context.limits.hostelLimit,
      used: 1, // Placeholder
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "Manage Multiple Hostels is not supported on the BASE plan. Please upgrade.",
    };
  }

  // 3. Can add Resident
  async canAddResident(workspaceId) {
    return this.checkQuota(workspaceId, null, "residentLimit", async () => {
      const hostelIds = await this.getHostelIds(workspaceId);
      return await Resident.countDocuments({ hostelId: { $in: hostelIds }, status: "active" });
    });
  }

  // 4. Can use Payroll
  async canUsePayroll(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.features.includes("payroll");
    return {
      allowed,
      limit: allowed ? "Unlimited" : 0,
      used: 0,
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "Payroll feature is not enabled on your plan.",
    };
  }

  // 5. Can use AI
  async canUseAI(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.features.includes("canUseAI");
    return {
      allowed,
      limit: allowed ? "Unlimited" : 0,
      used: 0,
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "AI Analytics is not enabled on your plan.",
    };
  }

  // 6. Can export reports
  async canExportReports(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.features.includes("analytics") || context.planName === "pro" || context.planName === "enterprise";
    return {
      allowed,
      limit: allowed ? "Unlimited" : 0,
      used: 0,
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "Export reports is not enabled on your plan.",
    };
  }

  // 7. Can access analytics
  async canAccessAnalytics(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.features.includes("analytics");
    return {
      allowed,
      limit: allowed ? "Unlimited" : 0,
      used: 0,
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "Advanced Analytics is not enabled on your plan.",
    };
  }

  // 8. Can upload documents
  async canUploadDocuments(workspaceId) {
    return this.checkQuota(workspaceId, null, "storageLimit", async () => {
      const storage = await StorageUsage.findOne({ workspaceId });
      return storage ? storage.usedBytes : 0;
    });
  }

  // 9. Can use storage tracking
  async canUseStorageTracking(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = true; // Enabled on all plans (with different limits)
    return {
      allowed,
      limit: context.limits.storageLimit,
      used: 0,
      remaining: context.limits.storageLimit,
      message: null,
    };
  }

  // 10. Can invite staff
  async canInviteStaff(workspaceId) {
    return this.checkQuota(workspaceId, "canUseStaff", "staffLimit", async () => {
      const hostelIds = await this.getHostelIds(workspaceId);
      return await Staff.countDocuments({ hostelId: { $in: hostelIds }, isDeleted: false });
    });
  }

  // 11. Can access marketplace
  async canAccessMarketplace(workspaceId) {
    const context = await this.getSubscriptionContext(workspaceId);
    const allowed = context.features.includes("marketplace");
    return {
      allowed,
      limit: allowed ? "Unlimited" : 0,
      used: 0,
      remaining: allowed ? "Unlimited" : 0,
      message: allowed ? null : "Marketplace access is not enabled on your plan.",
    };
  }
}

module.exports = new FeatureGateService();
