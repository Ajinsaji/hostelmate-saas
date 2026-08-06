class DeveloperService {
  async getApiKeys(workspaceId) {
    return {
      success: true,
      apiKeys: [
        { id: "key_live_1", name: "Production API Key", keyPrefix: "hm_live_9a...", createdAt: "2026-08-01", lastUsed: "10 mins ago", status: "Active" },
        { id: "key_test_1", name: "Development Secret", keyPrefix: "hm_test_3f...", createdAt: "2026-08-02", lastUsed: "2 days ago", status: "Active" }
      ],
      usageStats: {
        totalRequestsThisMonth: 14250,
        rateLimitPerMinute: 600,
        errorRatePct: 0.02
      }
    };
  }

  async generateApiKey(workspaceId, { name }) {
    const rawSecret = `hm_live_${Math.random().toString(36).substring(2)}${Date.now()}`;
    return {
      success: true,
      message: "API Key created. Please copy it now as it won't be shown again.",
      apiKey: {
        id: `key_${Date.now()}`,
        name: name || "New API Key",
        secret: rawSecret,
        createdAt: new Date().toISOString(),
        status: "Active"
      }
    };
  }

  async deleteApiKey(workspaceId, keyId) {
    return {
      success: true,
      message: `API Key ${keyId} revoked`
    };
  }

  async getWebhooks(workspaceId) {
    return {
      success: true,
      webhooks: [
        { id: "wh_1", url: "https://api.mycompany.com/webhooks/hostelmate", events: ["resident.admitted", "payment.received"], status: "Active", secret: "whsec_99a8b7c6" }
      ]
    };
  }

  async createWebhook(workspaceId, { url, events }) {
    return {
      success: true,
      webhook: {
        id: `wh_${Date.now()}`,
        url,
        events: events || ["payment.received"],
        status: "Active",
        secret: `whsec_${Math.random().toString(36).substring(2)}`
      }
    };
  }

  async updateWebhook(workspaceId, webhookId, data) {
    return {
      success: true,
      message: `Webhook ${webhookId} updated`
    };
  }

  async deleteWebhook(workspaceId, webhookId) {
    return {
      success: true,
      message: `Webhook ${webhookId} deleted`
    };
  }
}

module.exports = new DeveloperService();
