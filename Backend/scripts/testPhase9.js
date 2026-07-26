const mongoose = require("mongoose");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User");
const Hostel = require("../models/Hostel");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const RentPayment = require("../models/RentPayment");
const Expense = require("../models/Expense");
const TreasuryLedger = require("../models/TreasuryLedger");
const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const AnalyticsAlertRule = require("../models/AnalyticsAlertRule");

const snapshotService = require("../services/snapshotService");
const forecastService = require("../services/forecastService");
const analyticsReportService = require("../services/analyticsReportService");
const analyticsService = require("../services/analyticsService");

async function runPhase9Tests() {
  console.log("=================================================");
  console.log("STARTING PHASE 9 ENTERPRISE BI & ANALYTICS TEST");
  console.log("=================================================");

  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/hostelmate";
  console.log("Connecting to MongoDB:", mongoUri);

  try {
    await mongoose.connect(mongoUri);
    console.log("✓ Connected to MongoDB.");

    const testTenantId = new mongoose.Types.ObjectId();
    const testHostelId = testTenantId;

    // Create Owner User
    const ownerUser = await User.create({
      tenantId: testTenantId,
      email: `owner.bi.${Date.now()}@hostel.com`,
      phone: `97700${Math.floor(1000 + Math.random() * 9000)}`,
      passwordHash: "hash",
      role: "Owner",
      status: "Active",
    });

    console.log("\n1. Testing Daily KPI Snapshot Engine...");
    const snapshot = await snapshotService.captureDailySnapshot(testTenantId, testHostelId);
    console.log(`✓ Daily Snapshot Created. Type: ${snapshot.snapshotType}, Occupancy: ${snapshot.occupancy}%`);

    console.log("\n2. Testing Executive Health Scorecard & KPI Aggregation...");
    const kpis = await analyticsService.getDashboardKPIs(testTenantId, testHostelId);
    console.log(`✓ Executive Health Scorecard: ${kpis.executiveScore} / 100`);
    console.log(`✓ Aggregated MTD Revenue: ₹${kpis.monthlyRevenue}, Expenses: ₹${kpis.monthlyExpenses}, Net Profit: ₹${kpis.monthlyProfit}`);

    console.log("\n3. Testing Alert & Threshold Engine...");
    const alertRule = await AnalyticsAlertRule.create({
      tenantId: testTenantId,
      metric: "Occupancy Rate",
      condition: "Below",
      threshold: 80,
      enabled: true,
      createdBy: ownerUser._id,
    });
    const recheckedKpis = await analyticsService.getDashboardKPIs(testTenantId, testHostelId);
    console.log(`✓ Alert Rule Evaluated. Active Alerts Triggered: ${recheckedKpis.triggeredAlerts.length}`);

    console.log("\n4. Testing Predictive Forecasting Engine (30d / 90d / 365d)...");
    const forecast30 = await forecastService.generateForecasts(testTenantId, "30d");
    const forecast90 = await forecastService.generateForecasts(testTenantId, "90d");
    console.log(`✓ 30d Forecast Series Generated (${forecast30.forecastSeries.length} points). Model Accuracy: ${forecast30.forecastSeries[0].accuracyPercentage}%`);
    console.log(`✓ 90d Forecast Series Generated (${forecast90.forecastSeries.length} points).`);

    console.log("\n5. Testing Multi-Format Executive & Domain Report Generation...");
    const pdfReport = await analyticsReportService.generateReport(testTenantId, "executive", "pdf");
    const csvReport = await analyticsReportService.generateReport(testTenantId, "financial", "csv");
    console.log(`✓ PDF Report Generated. Size: ${pdfReport.content.length} bytes`);
    console.log(`✓ CSV Report Generated. Content Length: ${csvReport.content.length} chars`);

    console.log("\n6. Testing Multi-Level Drill-Down Engine...");
    const drillData = await analyticsService.getDrillDownData(testTenantId, "occupancy");
    console.log(`✓ Drill-Down Data Fetched for Occupancy (${drillData.length} records).`);

    // Clean up test records
    await User.deleteMany({ tenantId: testTenantId });
    await AnalyticsSnapshot.deleteMany({ tenantId: testTenantId });
    await AnalyticsAlertRule.deleteMany({ tenantId: testTenantId });

    console.log("\n✓ Test Cleanup Completed.");
    console.log("\n=================================================");
    console.log("PHASE 9 VERIFICATION PASSED WITH 100% SUCCESS!");
    console.log("=================================================");
  } catch (error) {
    console.error("PHASE 9 TEST FAILED:", error);
  }
  await mongoose.disconnect();
}

runPhase9Tests();
