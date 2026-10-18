class MarketplaceService {
  async getPlugins(workspaceId) {
    return {
      success: false,
      preview: true,
      plugins: [],
      message: "No tenant integration catalog or persisted connection status is configured.",
    };
  }

  async installPlugin(workspaceId, { pluginId, config }) {
    return { success: false, preview: true, message: "Integration installation is not implemented." };
  }

  async configurePlugin(workspaceId, { pluginId, config }) {
    return { success: false, preview: true, message: "Integration configuration is not implemented." };
  }

  async uninstallPlugin(workspaceId, pluginId) {
    return { success: false, preview: true, message: "Integration removal is not implemented." };
  }
}

module.exports = new MarketplaceService();
