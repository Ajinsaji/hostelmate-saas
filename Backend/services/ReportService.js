class ReportService {
  async getAvailableReports(workspaceId) {
    return {
      success: true,
      reports: [
        { id: "rep_occ", name: "Occupancy & Bed Utilization Report", category: "Operations", formats: ["PDF", "Excel", "CSV"] },
        { id: "rep_rev", name: "Rent Collections & Revenue Statement", category: "Finance", formats: ["PDF", "Excel", "CSV"] },
        { id: "rep_exp", name: "Operational Expenses Ledger", category: "Finance", formats: ["PDF", "Excel", "CSV"] },
        { id: "rep_res", name: "Active Resident Directory & Dues Report", category: "Residents", formats: ["PDF", "Excel", "CSV"] },
        { id: "rep_staff", name: "Staff Payroll & Attendance Register", category: "HR", formats: ["PDF", "Excel", "CSV"] },
        { id: "rep_sub", name: "SaaS Subscription & License Audit", category: "System", formats: ["PDF", "Excel"] }
      ]
    };
  }

  async generateReport(workspaceId, { reportId, format, startDate, endDate }) {
    return {
      success: false,
      message: "Report generation is not available yet. This module is currently in preview and no file was created."
    };
  }

  async emailReport(workspaceId, { reportId, recipientEmail, format }) {
    return {
      success: false,
      message: "Report email delivery is not available yet. No email was sent."
    };
  }
}

module.exports = new ReportService();
