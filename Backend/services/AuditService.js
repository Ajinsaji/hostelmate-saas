class AuditService {
  async getAuditLogs(workspaceId) {
    return {
      success: true,
      logs: [
        { id: "audit_1", action: "RESIDENT_ADMITTED", user: "Ajin (Owner)", ip: "192.168.1.10", browser: "Chrome 127", timestamp: new Date().toISOString(), details: "Admitted resident Rajesh Kumar to Room 102" },
        { id: "audit_2", action: "PAYMENT_RECORDED", user: "Warden Office", ip: "192.168.1.15", browser: "Edge 126", timestamp: new Date(Date.now() - 3600000).toISOString(), details: "Recorded ₹7,500 rent payment via UPI" },
        { id: "audit_3", action: "BRANDING_UPDATED", user: "Ajin (Owner)", ip: "192.168.1.10", browser: "Chrome 127", timestamp: new Date(Date.now() - 86400000).toISOString(), details: "Updated custom brand colors and logo" },
        { id: "audit_4", action: "API_KEY_CREATED", user: "Ajin (Owner)", ip: "192.168.1.10", browser: "Chrome 127", timestamp: new Date(Date.now() - 172800000).toISOString(), details: "Generated new Production API Key" }
      ]
    };
  }

  async getAuditById(workspaceId, auditId) {
    return {
      success: true,
      log: {
        id: auditId,
        action: "BRANDING_UPDATED",
        user: "Ajin (Owner)",
        ip: "192.168.1.10",
        browser: "Chrome 127 / Windows",
        timestamp: new Date().toISOString(),
        oldValue: { primaryColor: "#16A34A" },
        newValue: { primaryColor: "#15803D" }
      }
    };
  }

  async exportAudit(workspaceId) {
    return {
      success: true,
      downloadUrl: "/api/v2/audit/export/csv",
      format: "CSV"
    };
  }
}

module.exports = new AuditService();
