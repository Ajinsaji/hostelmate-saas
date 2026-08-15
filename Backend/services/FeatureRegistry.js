class FeatureRegistry {
  async getFeaturesAndLimits(workspaceId) {
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
      plan: "Unified",
      features: allFeatures,
      limits: {
        hostel: 999999,
        resident: 999999,
        staff: 999999,
        storage: 100 * 1024 * 1024 * 1024,
      },
    };
  }

  async has(workspaceId, featureCode) {
    return true;
  }

  async limit(workspaceId, resource) {
    return 999999;
  }
}

module.exports = new FeatureRegistry();
