const Plan = require("../models/Plan");
const Subscription = require("../models/Subscription");
const WorkspaceCacheService = require("./WorkspaceCacheService");

class FeatureRegistry {
  async getFeaturesAndLimits(workspaceId) {
    if (!workspaceId) {
      return {
        plan: "base",
        features: ["canUseStaff", "canUseFood", "canUseExpenses"],
        limits: { hostel: 1, resident: 100, staff: 5, storage: 5368709120 },
      };
    }

    const cacheKey = `features:${workspaceId}`;
    const cached = await WorkspaceCacheService.get(cacheKey);
    if (cached) return cached;

    const subscription = await Subscription.findOne({ workspaceId }).lean();
    const planName = subscription?.plan || "base";

    const planLimits = await Plan.findOne({ name: planName }).lean();
    const data = {
      plan: planName,
      features: planLimits ? planLimits.features : ["canUseStaff", "canUseFood", "canUseExpenses"],
      limits: {
        hostel: planLimits ? planLimits.hostelLimit : (subscription?.hostelLimit || 1),
        resident: planLimits ? planLimits.residentLimit : (subscription?.residentLimit || 100),
        staff: planLimits ? planLimits.staffLimit : (subscription?.staffLimit || 5),
        storage: planLimits ? planLimits.storageLimit : (subscription?.storageLimit || 5368709120),
      },
    };

    await WorkspaceCacheService.set(cacheKey, data);
    return data;
  }

  async has(workspaceId, featureCode) {
    const context = await this.getFeaturesAndLimits(workspaceId);
    return context.features.includes(featureCode);
  }

  async limit(workspaceId, resource) {
    const context = await this.getFeaturesAndLimits(workspaceId);
    return context.limits[resource] || 0;
  }
}

module.exports = new FeatureRegistry();
