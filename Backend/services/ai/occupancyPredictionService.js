const Room = require("../../models/Room");
const Bed = require("../../models/Bed");
const Resident = require("../../models/Resident");
const AIProviderFactory = require("./AIProviderFactory");

async function predictOccupancy(tenantId) {
  // 1. Gather historical/current data
  const totalBeds = await Bed.countDocuments({ hostelId: tenantId });
  const occupiedBeds = await Bed.countDocuments({ hostelId: tenantId, isOccupied: true });
  const currentOccupancy = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;
  
  // Future departures (residents leaving within 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  // (Assuming there might be a planned departure date in Resident model, or we just mock for heuristics)
  const expectedDepartures = await Resident.countDocuments({ 
      hostelId: tenantId, 
      status: "Active", 
      // mock query for any field like expectedLeaveDate
  }); // In reality, query actual notice periods. For now, heuristics.

  const historicalData = {
    totalBeds,
    occupiedBeds,
    currentOccupancy,
    expectedDepartures: 0, // Mocked
    expectedAdmissions: 0, // Mocked
  };

  // 2. Pass to AI Provider
  const provider = await AIProviderFactory.getProvider(tenantId);
  const forecast = await provider.generateForecast("Occupancy", historicalData);

  // 3. Format output
  return {
    currentOccupancy: parseFloat(currentOccupancy.toFixed(2)),
    predictions: {
      days30: forecast.days30 || currentOccupancy,
      days90: forecast.days90 || currentOccupancy,
      days365: forecast.days365 || currentOccupancy,
    },
    seasonalTrend: forecast.seasonalTrend || "Stable",
    expectedAdmissions: forecast.expectedAdmissions || 0,
    expectedDepartures: forecast.expectedDepartures || 0,
    vacancyForecast: totalBeds - Math.round((forecast.days30 || currentOccupancy) * totalBeds / 100),
    confidence: forecast.confidence || 80,
    contributingFactors: forecast.contributingFactors || ["Historical trends", "Stable occupancy base"],
    generatedAt: new Date(),
    modelVersion: provider.name,
  };
}

module.exports = { predictOccupancy };
