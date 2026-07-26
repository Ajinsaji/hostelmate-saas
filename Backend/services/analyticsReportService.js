const PDFDocument = require("pdfkit");
let parseJson2Csv = null;
try {
  const json2csvPkg = require("json2csv");
  parseJson2Csv = json2csvPkg.parse || json2csvPkg.Parser;
} catch (e) {
  // fallback
}

const convertToCsv = (items) => {
  if (parseJson2Csv) {
    try {
      return typeof parseJson2Csv === "function" ? parseJson2Csv(items) : new parseJson2Csv().parse(items);
    } catch (e) {}
  }
  if (!items || !items.length) return "Metric,Value\n";
  const keys = Object.keys(items[0]);
  const header = keys.join(",");
  const rows = items.map((item) => keys.map((k) => `"${item[k]}"`).join(","));
  return [header, ...rows].join("\n");
};

const generateReportData = async (tenantId, reportType) => {
  const Resident = require("../models/Resident");
  const Bed = require("../models/Bed");
  const RentPayment = require("../models/RentPayment");
  const Expense = require("../models/Expense");
  const PayrollRecord = require("../models/PayrollRecord");

  const residents = await Resident.countDocuments({ tenantId, isDeleted: false, status: "Active" });
  const totalBeds = await Bed.countDocuments({ tenantId, isDeleted: false });
  const occupiedBeds = await Bed.countDocuments({ tenantId, isOccupied: true, isDeleted: false });

  const payments = await RentPayment.find({ tenantId }).limit(50);
  const expenses = await Expense.find({ tenantId, isDeleted: false }).limit(50);
  const payrolls = await PayrollRecord.find({ tenantId }).limit(50);

  let totalRev = 0;
  payments.forEach((p) => { totalRev += p.amountPaid || 0; });
  let totalExp = 0;
  expenses.forEach((e) => { totalExp += e.amount || 0; });
  let totalPay = 0;
  payrolls.forEach((pr) => { totalPay += pr.netSalary || 0; });

  return {
    reportType,
    generatedAt: new Date().toISOString(),
    metrics: {
      residentCount: residents,
      totalBeds,
      occupiedBeds,
      occupancyPct: totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0,
      totalRevenue: totalRev,
      totalExpenses: totalExp,
      totalPayroll: totalPay,
      netProfit: totalRev - totalExp - totalPay,
    },
    payments,
    expenses,
    payrolls,
  };
};

const generateReport = async (tenantId, reportType = "executive", format = "pdf") => {
  const data = await generateReportData(tenantId, reportType);

  if (format === "csv") {
    const csvString = convertToCsv([
      { Metric: "Total Residents", Value: data.metrics.residentCount },
      { Metric: "Total Beds", Value: data.metrics.totalBeds },
      { Metric: "Occupancy Rate (%)", Value: data.metrics.occupancyPct },
      { Metric: "Total Revenue (₹)", Value: data.metrics.totalRevenue },
      { Metric: "Total Expenses (₹)", Value: data.metrics.totalExpenses },
      { Metric: "Total Payroll (₹)", Value: data.metrics.totalPayroll },
      { Metric: "Net Operating Profit (₹)", Value: data.metrics.netProfit },
    ]);
    return { format: "csv", contentType: "text/csv", filename: `${reportType}_report.csv`, content: csvString };
  }

  if (format === "excel") {
    // Return CSV format as spreadsheet fallback for testing
    const csvString = convertToCsv([
      { Metric: "Total Residents", Value: data.metrics.residentCount },
      { Metric: "Occupancy Rate (%)", Value: data.metrics.occupancyPct },
      { Metric: "Total Revenue (₹)", Value: data.metrics.totalRevenue },
      { Metric: "Total Expenses (₹)", Value: data.metrics.totalExpenses },
      { Metric: "Net Profit (₹)", Value: data.metrics.netProfit },
    ]);
    return { format: "excel", contentType: "text/csv", filename: `${reportType}_report.csv`, content: csvString };
  }

  // PDF Generation via PDFKit
  const pdfPromise = new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));

      doc.fillColor("#0f172a").fontSize(20).text(`HOSTELMATE ${reportType.toUpperCase()} REPORT`, { align: "center" });
      doc.fontSize(10).fillColor("#64748b").text(`Generated: ${new Date().toLocaleString()}`, { align: "center" });
      doc.moveDown(2);

      doc.fontSize(12).fillColor("#1e293b").text("KEY PERFORMANCE METRICS", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#334155");
      doc.text(`Active Residents: ${data.metrics.residentCount}`);
      doc.text(`Occupancy Rate: ${data.metrics.occupancyPct}% (${data.metrics.occupiedBeds} / ${data.metrics.totalBeds} beds)`);
      doc.text(`Total Revenue: ₹${data.metrics.totalRevenue.toLocaleString("en-IN")}`);
      doc.text(`Total Expenses: ₹${data.metrics.totalExpenses.toLocaleString("en-IN")}`);
      doc.text(`Total Payroll: ₹${data.metrics.totalPayroll.toLocaleString("en-IN")}`);
      doc.fontSize(12).fillColor("#047857").text(`Net Operating Profit: ₹${data.metrics.netProfit.toLocaleString("en-IN")}`, { bold: true });

      doc.moveDown(2);
      doc.fontSize(8).fillColor("#94a3b8").text("Generated by HostelMate Enterprise BI Reporting Engine", { align: "center" });
      doc.end();
    } catch (e) {
      reject(e);
    }
  });

  const pdfBuffer = await pdfPromise;
  return { format: "pdf", contentType: "application/pdf", filename: `${reportType}_report.pdf`, content: pdfBuffer };
};

module.exports = {
  generateReport,
};
