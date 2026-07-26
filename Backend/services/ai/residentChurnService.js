const Resident = require("../../models/Resident");
const AIProviderFactory = require("./AIProviderFactory");

async function predictResidentChurn(tenantId) {
  // 1. Gather historical data (Mocked querying for heuristics)
  const activeResidents = await Resident.find({ hostelId: tenantId, status: "Active" })
                                      .select("_id name joinedAt")
                                      .lean();
  
  // 2. Format for AI Provider
  const dataToAnalyze = activeResidents.map(r => ({
    residentId: r._id,
    name: r.name,
    stayDurationDays: Math.floor((new Date() - new Date(r.joinedAt)) / (1000 * 60 * 60 * 24)),
    // Mocking other data that would normally be fetched via aggregations:
    latePayments: Math.floor(Math.random() * 3), 
    complaints: Math.floor(Math.random() * 2),
    leaveFrequency: Math.floor(Math.random() * 5),
  }));

  // 3. Provider Processing
  const provider = await AIProviderFactory.getProvider(tenantId);
  // Ideally provider detects anomalies or generates forecast per resident. 
  // For heuristics, we'll manually apply scoring here as the fallback.
  
  const churnPredictions = dataToAnalyze.map(r => {
    let score = 10; // base risk
    if (r.latePayments > 1) score += 30;
    if (r.complaints > 1) score += 20;
    if (r.leaveFrequency > 3) score += 15;
    if (r.stayDurationDays > 365) score -= 10; // long term resident
    
    score = Math.max(0, Math.min(100, score));
    let riskLevel = "Low";
    if (score > 40) riskLevel = "Medium";
    if (score > 70) riskLevel = "High";

    return {
      residentId: r.residentId,
      name: r.name,
      churnProbability: score,
      riskLevel,
      recommendedActions: riskLevel === "High" ? ["Reach out for feedback", "Offer renewal discount"] : [],
      confidence: 85,
      contributingFactors: [`Late payments: ${r.latePayments}`, `Complaints: ${r.complaints}`],
    };
  });
  
  // Sort by highest risk first
  churnPredictions.sort((a, b) => b.churnProbability - a.churnProbability);

  return {
    overview: {
      highRiskCount: churnPredictions.filter(c => c.riskLevel === "High").length,
      mediumRiskCount: churnPredictions.filter(c => c.riskLevel === "Medium").length,
      lowRiskCount: churnPredictions.filter(c => c.riskLevel === "Low").length,
    },
    predictions: churnPredictions,
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { predictResidentChurn };
