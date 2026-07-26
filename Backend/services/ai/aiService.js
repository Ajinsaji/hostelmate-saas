const { predictOccupancy } = require("./occupancyPredictionService");
const { predictResidentChurn } = require("./residentChurnService");
const { predictRevenue } = require("./revenuePredictionService");
const { analyzeProcurement } = require("./procurementAIService");
const { analyzePayroll } = require("./payrollAIService");
const { analyzeExpenses } = require("./expenseAIService");
const { predictTreasury } = require("./treasuryAIService");
const { generateRecommendation, getPendingRecommendations } = require("./recommendationService");

/**
 * Coordinator service for generating the master AI Insights dashboard data.
 * Applies tenant isolation and caches/returns results.
 */
async function getDashboardInsights(tenantId) {
  // In a real application we would cache this data in Redis or Mongoose to avoid heavy processing on every load.
  // For Phase 10 we generate it concurrently.
  
  const [
    occupancy,
    churn,
    revenue,
    procurement,
    payroll,
    expenses,
    treasury,
    pendingRecommendations
  ] = await Promise.all([
    predictOccupancy(tenantId),
    predictResidentChurn(tenantId),
    predictRevenue(tenantId),
    analyzeProcurement(tenantId),
    analyzePayroll(tenantId),
    analyzeExpenses(tenantId),
    predictTreasury(tenantId),
    getPendingRecommendations(tenantId)
  ]);

  // Optionally auto-generate recommendations based on anomalies right here if none exist
  // E.g., if treasury has high cash shortage risk, auto-recommend
  if (treasury.forecasts.cashShortageRisk === "High" && !pendingRecommendations.some(r => r.category === "Treasury")) {
    await generateRecommendation(
      tenantId,
      "Treasury",
      "Delay non-essential AP payments and accelerate rent collection to avoid liquidity crisis.",
      "Critical",
      treasury.confidence,
      "Treasury balance is projected to fall below safe operating reserves."
    );
  }

  return {
    executiveInsights: {
      healthScore: 85, // Example aggregated metric
      topRisk: churn.overview.highRiskCount > 0 ? "Resident Churn" : "None",
    },
    predictions: {
      occupancy,
      revenue,
      churn,
    },
    risks: {
      payroll,
      expenses,
      treasury,
      procurement,
    },
    recommendations: pendingRecommendations, // To be refreshed next call if we just generated one
  };
}

module.exports = {
  getDashboardInsights,
  predictOccupancy,
  predictResidentChurn,
  predictRevenue,
  analyzeProcurement,
  analyzePayroll,
  analyzeExpenses,
  predictTreasury
};
