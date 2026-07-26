const Expense = require("../../models/Expense");
const AIProviderFactory = require("./AIProviderFactory");

async function analyzeExpenses(tenantId) {
  // 1. Fetch recent expenses
  const expenses = await Expense.find({ hostelId: tenantId })
    .sort({ date: -1 })
    .limit(100)
    .lean();

  // 2. Format for anomaly detection
  const dataToAnalyze = expenses.map(e => ({
    id: e._id,
    amount: e.amount,
    category: e.category,
    date: e.date,
  }));

  // 3. Detect anomalies via Provider
  const provider = await AIProviderFactory.getProvider(tenantId);
  const anomalies = await provider.detectAnomalies("Expense", dataToAnalyze);

  return {
    anomalies,
    overview: {
      totalAnomalies: anomalies.length,
      highSeverity: anomalies.filter(a => a.severity === "High").length,
    },
    confidence: 85,
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { analyzeExpenses };
