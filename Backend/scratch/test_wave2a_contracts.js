const assert = require("node:assert/strict");

const analyticsService = require("../services/analyticsService");
const reportService = require("../services/ReportService");
const adminOnly = require("../middleware/adminOnly");
const Resident = require("../models/Resident");
const Bed = require("../models/Bed");
const RentPayment = require("../models/RentPayment");
const Expense = require("../models/Expense");

async function run() {
  let checks = 0;
  let residentFilter;
  let bedFilter;
  let rentPipeline;
  let expensePipeline;

  Resident.countDocuments = async (filter) => {
    residentFilter = filter;
    return 3;
  };
  Bed.countDocuments = async (filter) => {
    bedFilter = filter;
    return filter.status ? 6 : 10;
  };
  RentPayment.aggregate = async (pipeline) => {
    rentPipeline = pipeline;
    return [{ total: 12500 }];
  };
  Expense.aggregate = async (pipeline) => {
    expensePipeline = pipeline;
    return [{ total: 2500 }];
  };

  const dashboard = await analyticsService.getDashboard("workspace-id", "hostel-id", "90d");
  assert.equal(dashboard.totalResidents, 3);
  checks += 1;
  assert.equal(dashboard.totalBeds, 10);
  checks += 1;
  assert.equal(dashboard.occupiedBeds, 6);
  checks += 1;
  assert.equal(dashboard.occupancyRate, 60);
  checks += 1;
  assert.equal(dashboard.periodRevenue, 12500);
  checks += 1;
  assert.equal(dashboard.periodExpenses, 2500);
  checks += 1;
  assert.equal(dashboard.netProfit, 10000);
  checks += 1;
  assert.deepEqual(residentFilter.hostelId, { $in: ["hostel-id"] });
  checks += 1;
  assert.deepEqual(bedFilter.hostelId, { $in: ["hostel-id"] });
  checks += 1;
  assert.deepEqual(rentPipeline[0].$match.hostelId, { $in: ["hostel-id"] });
  checks += 1;
  assert.equal(rentPipeline[0].$match.status, "Completed");
  checks += 1;
  assert.equal(rentPipeline[0].$match.paymentDate.$gte instanceof Date, true);
  checks += 1;
  assert.equal(expensePipeline[0].$match.status, "Paid");
  checks += 1;
  assert.equal(expensePipeline[0].$match.isDeleted, false);
  checks += 1;
  assert.equal(expensePipeline[0].$match.expenseDate.$gte instanceof Date, true);
  checks += 1;
  assert.ok(dashboard.periodStart < dashboard.periodEnd);
  checks += 1;

  const previewReport = await reportService.generateReport("workspace-id", {
    reportId: "rep_rev",
    format: "PDF",
  });
  assert.equal(previewReport.success, false);
  checks += 1;
  assert.equal(previewReport.downloadUrl, undefined);
  checks += 1;

  const previewEmail = await reportService.emailReport("workspace-id", {
    reportId: "rep_rev",
    recipientEmail: "test@example.com",
    format: "PDF",
  });
  assert.equal(previewEmail.success, false);
  checks += 1;

  for (const role of ["owner", "Warden", "Cook", "Accountant"]) {
    let status;
    adminOnly(
      { user: { role } },
      { status: (code) => ({ json: () => { status = code; } }) },
      () => assert.fail(`${role} must not enter admin release-note mutations`)
    );
    assert.equal(status, 403);
    checks += 1;
  }

  for (const role of ["admin", "super_admin"]) {
    let passed = false;
    adminOnly({ user: { role } }, {}, () => { passed = true; });
    assert.equal(passed, true);
    checks += 1;
  }

  console.log(`PASS: Wave 2A analytics, reports, and admin access contracts (${checks} assertions)`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
