const Subscription = require("../models/Subscription");
const Hostel = require("../models/Hostel");
const Resident = require("../models/Resident");
const Staff = require("../models/Staff");
const StorageUsage = require("../models/StorageUsage");

class FeatureGateService {
  /**
   * Unified Owner Context - All features and modules are fully enabled
   */
  async getSubscriptionContext(workspaceId) {
    const allFeatures = [
      "canUseStaff",
      "canUseFood",
      "canUseVisitors",
      "canUseExpenses",
      "canSendWhatsApp",
      "canUseAI",
      "payroll",
      "analytics",
      "reports",
      "marketplace",
    ];

    return {
      planName: "Unified",
      features: allFeatures,
      limits: {
        hostelLimit: 999999,
        residentLimit: 999999,
        staffLimit: 999999,
        storageLimit: 100 * 1024 * 1024 * 1024, // 100GB
      },
    };
  }

  async checkQuota(workspaceId, featureCode, limitKey, getUsedCountFn) {
    const usedValue = getUsedCountFn ? await getUsedCountFn() : 0;
    return {
      allowed: true,
      limit: "Unlimited",
      used: usedValue,
      remaining: "Unlimited",
      message: null,
    };
  }

  async getHostelIds(workspaceId) {
    const hostels = await Hostel.find({ workspaceId }).select("_id");
    return hostels.map((h) => h._id);
  }

  async canAddHostel(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 1, remaining: "Unlimited", message: null };
  }

  async canManageMultipleHostels(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 1, remaining: "Unlimited", message: null };
  }

  async canAddResident(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canUsePayroll(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canUseAI(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canExportReports(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canAccessAnalytics(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canUploadDocuments(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canUseStorageTracking(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canInviteStaff(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }

  async canAccessMarketplace(workspaceId) {
    return { allowed: true, limit: "Unlimited", used: 0, remaining: "Unlimited", message: null };
  }
}

module.exports = new FeatureGateService();
