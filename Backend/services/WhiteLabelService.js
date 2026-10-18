class WhiteLabelService {
  async getBranding(workspaceId) {
    return {
      success: false,
      preview: true,
      branding: null,
      message: "Workspace branding is unavailable until tenant-specific branding storage is configured.",
    };
  }

  async updateBranding(workspaceId, brandingData) {
    return { success: false, preview: true, message: "Workspace branding updates are not persisted by this preview service." };
  }

  async addDomain(workspaceId, { domain }) {
    return { success: false, preview: true, message: "Custom-domain routing and DNS verification are not configured." };
  }

  async getDomainStatus(workspaceId) {
    return { success: false, preview: true, message: "No custom domain is configured for this workspace." };
  }

  async removeDomain(workspaceId) {
    return { success: false, preview: true, message: "Custom-domain routing is not configured." };
  }
}

module.exports = new WhiteLabelService();
