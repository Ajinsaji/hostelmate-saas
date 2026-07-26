const PayrollRecord = require("../../models/PayrollRecord");
const OvertimeRequest = require("../../models/OvertimeRequest");
const LeaveRequest = require("../../models/LeaveRequest");
const AIProviderFactory = require("./AIProviderFactory");

async function analyzePayroll(tenantId) {
  // 1. Fetch recent payroll data
  const recentPayroll = await PayrollRecord.find({ hostelId: tenantId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
    
  const overtimeData = await OvertimeRequest.find({ hostelId: tenantId, status: "Approved" })
    .sort({ date: -1 })
    .limit(50)
    .lean();

  // 2. Format data for anomaly detection
  const dataToAnalyze = recentPayroll.map(p => ({
    id: p._id,
    netPay: p.netPay,
    employeeId: p.staffId,
  })).concat(overtimeData.map(o => ({
    id: o._id,
    overtimeHours: o.hours,
    employeeId: o.staffId,
    type: 'Overtime'
  })));

  // 3. Provider detection
  const provider = await AIProviderFactory.getProvider(tenantId);
  const anomalies = await provider.detectAnomalies("Payroll", dataToAnalyze);

  return {
    anomalies,
    overview: {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter(a => a.severity === "High").length,
    },
    confidence: 90,
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { analyzePayroll };
