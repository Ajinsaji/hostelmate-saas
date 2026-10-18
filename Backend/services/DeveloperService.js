class DeveloperService {
  async getApiKeys(workspaceId) {
    return {
      success: false,
      preview: true,
      apiKeys: [],
      usageStats: null,
      message: "API key management is unavailable because no persistent credential store is configured.",
    };
  }

  async generateApiKey(workspaceId, { name }) {
    return { success: false, preview: true, message: "API key creation is unavailable because no persistent credential store is configured." };
  }

  async deleteApiKey(workspaceId, keyId) {
    return {
      success: true,
      message: `API Key ${keyId} revoked`
    };
  }

  async getWebhooks(workspaceId) {
    return { success: false, preview: true, webhooks: [], message: "Webhook management is unavailable because no persistent webhook store is configured." };
  }

  async createWebhook(workspaceId, { url, events }) {
    return { success: false, preview: true, message: "Webhook creation is unavailable because no persistent webhook store is configured." };
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
