class AuditService {
  async getAuditLogs(workspaceId) {
    return {
      success: false,
      preview: true,
      logs: [],
      message: "Audit history is unavailable because this module is not connected to a persistent audit store.",
    };
  }

  async getAuditById(workspaceId, auditId) {
    return { success: false, preview: true, message: "Audit detail lookup is not connected to persistent audit records." };
  }

  async exportAudit(workspaceId) {
    return {
      success: false,
      preview: true,
      message: "Audit export is unavailable because no persistent audit store is configured.",
    };
  }
}

module.exports = new AuditService();
