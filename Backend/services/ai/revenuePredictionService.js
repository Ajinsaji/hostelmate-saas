const RentInvoice = require("../../models/RentInvoice");
const Expense = require("../../models/Expense");
const TreasuryLedger = require("../../models/TreasuryLedger");
const AIProviderFactory = require("./AIProviderFactory");

async function predictRevenue(tenantId) {
  // 1. Gather historical data
  // In a real implementation we would aggregate RentInvoices for the last 6 months,
  // expenses, and current treasury balance. Here we mock some sums for heuristics.
  
  const currentTreasury = await TreasuryLedger.aggregate([
    { $match: { hostelId: tenantId } },
    { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ["$type", "Credit"] }, "$amount", { $multiply: ["$amount", -1] }] } } } }
  ]);
  const balance = currentTreasury[0]?.balance || 50000;

  const historicalData = {
    lastMonthRevenue: 150000, // mock
    outstandingCollections: 20000, // mock
    lastMonthExpenses: 45000, // mock
    currentTreasuryBalance: balance
  };

  // 2. Generate Forecast via Provider
  const provider = await AIProviderFactory.getProvider(tenantId);
  const forecast = await provider.generateForecast("Revenue", historicalData);

  // 3. Format Response
  const expectedRevenue = forecast.nextMonth || historicalData.lastMonthRevenue * 1.02;
  const expectedCashFlow = expectedRevenue - historicalData.lastMonthExpenses;

  return {
    forecasts: {
      expectedRentIncomeNextMonth: expectedRevenue,
      expectedTreasuryBalanceNextMonth: balance + expectedCashFlow,
      outstandingCollectionsRisk: historicalData.outstandingCollections * 0.15, // e.g. 15% might not be collected
      expectedMonthlyProfit: expectedCashFlow,
    },
    confidence: forecast.confidence || 75,
    contributingFactors: forecast.contributingFactors || ["Historical payment trends", "Current occupancy levels"],
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { predictRevenue };
