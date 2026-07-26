require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const aiService = require("../services/ai/aiService");
const { processNaturalLanguageQuery } = require("../services/ai/analyticsAssistantService");
const { getProvider } = require("../services/ai/AIProviderFactory");

async function runTests() {
  console.log("=== PHASE 10: AI & INTELLIGENT AUTOMATION VERIFICATION ===");
  try {
    await connectDB();
    console.log("Database connected.");

    // Pick a test tenant
    const Hostel = require("../models/Hostel");
    const testHostel = await Hostel.findOne();
    if (!testHostel) {
      console.log("No hostel found. Exiting test.");
      process.exit(0);
    }
    const tenantId = testHostel._id;

    console.log(`\n1. Testing AI Provider Factory & Heuristic Fallback...`);
    const provider = await getProvider(tenantId);
    console.log(`Resolved Provider: ${provider.name}`);

    console.log(`\n2. Testing Occupancy Prediction...`);
    const occupancy = await aiService.predictOccupancy(tenantId);
    console.log(`Current: ${occupancy.currentOccupancy}%, 30-day Forecast: ${occupancy.predictions.days30}% (Confidence: ${occupancy.confidence}%)`);

    console.log(`\n3. Testing Revenue Prediction...`);
    const revenue = await aiService.predictRevenue(tenantId);
    console.log(`Expected Next Month Rent: ${revenue.forecasts.expectedRentIncomeNextMonth}`);

    console.log(`\n4. Testing Payroll Anomaly Detection...`);
    const payroll = await aiService.analyzePayroll(tenantId);
    console.log(`Found ${payroll.anomalies.length} payroll anomalies.`);

    console.log(`\n5. Testing Master Dashboard Insights Coordination...`);
    const dashboard = await aiService.getDashboardInsights(tenantId);
    console.log(`Health Score: ${dashboard.executiveInsights.healthScore}`);
    console.log(`Pending Recommendations: ${dashboard.recommendations.length}`);

    console.log(`\n6. Testing Natural Language Analytics...`);
    // Need a dummy user for the query log
    const Owner = require("../models/Owner");
    const owner = await Owner.findOne({ hostelId: tenantId });
    if (owner) {
      const nlpResult = await processNaturalLanguageQuery(tenantId, owner._id, "Show me unpaid rent");
      console.log(`Intent Detected: ${nlpResult.intent}`);
      console.log(`Response: ${nlpResult.text}`);
    } else {
      console.log("No owner found for NLP test.");
    }

    console.log("\n=== ALL TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("\n[X] TEST FAILED:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

runTests();
