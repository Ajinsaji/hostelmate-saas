const TreasuryLedger = require("../../models/TreasuryLedger");
const AIProviderFactory = require("./AIProviderFactory");

async function predictTreasury(tenantId) {
  // 1. Fetch treasury data
  const ledgerEntries = await TreasuryLedger.find({ hostelId: tenantId })
    .sort({ transactionDate: -1 })
    .limit(30)
    .lean();

  const balanceSum = ledgerEntries.reduce((acc, curr) => 
    curr.type === 'Credit' ? acc + curr.amount : acc - curr.amount, 0
  );

  const historicalData = {
    recentTransactions: ledgerEntries.length,
    currentBalance: balanceSum,
  };

  // 2. Generate Forecast via Provider
  const provider = await AIProviderFactory.getProvider(tenantId);
  const forecast = await provider.generateForecast("Treasury", historicalData);

  // 3. Format Response
  return {
    forecasts: {
      cashShortageRisk: balanceSum < 10000 ? "High" : "Low", // naive heuristic
      expectedLiquidity: forecast.expectedLiquidity || balanceSum,
    },
    recommendations: balanceSum < 10000 ? ["Delay non-essential AP payments", "Accelerate rent collection"] : ["Maintain reserve targets"],
    confidence: forecast.confidence || 80,
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { predictTreasury };
