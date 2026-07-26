const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const { logger } = require("./logger");

const generatePayslipPDF = async (payrollRecord, staff, hostel) => {
  return new Promise((resolve, reject) => {
    try {
      const payslipsDir = path.join(__dirname, "../uploads/payslips");
      if (!fs.existsSync(payslipsDir)) {
        fs.mkdirSync(payslipsDir, { recursive: true });
      }

      const filename = `payslip_${payrollRecord._id}.pdf`;
      const filePath = path.join(payslipsDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      const doc = new PDFDocument({ margin: 40, size: "A4" });
      doc.pipe(writeStream);

      // Header Section
      doc.fillColor("#0f172a").fontSize(20).text("HOSTELMATE PAYSLIP", { align: "center" });
      doc.fontSize(10).fillColor("#64748b").text(hostel?.name || "HostelMate Enterprise", { align: "center" });
      doc.moveDown(1.5);

      // Employee & Period Details Table
      doc.fillColor("#1e293b").fontSize(12).text("EMPLOYEE & PAYROLL DETAILS", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#334155");
      doc.text(`Employee Name: ${staff.fullName} | Employee Code: ${staff.employeeCode}`);
      doc.text(`Designation: ${staff.designation} | Role: ${staff.userId?.role || "Staff"}`);
      doc.text(`Payment Date: ${payrollRecord.paymentDate ? new Date(payrollRecord.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}`);
      doc.moveDown(1);

      // Attendance & Work Metrics
      doc.fillColor("#1e293b").fontSize(12).text("ATTENDANCE SUMMARY", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor("#334155");
      doc.text(`Present Days: ${payrollRecord.presentDays || 0} | Paid Leave Days: ${payrollRecord.paidLeaveDays || 0}`);
      doc.text(`Unpaid Leave Days: ${payrollRecord.unpaidLeaveDays || 0} | Overtime Hours: ${payrollRecord.overtimeHours || 0} hrs`);
      doc.moveDown(1);

      // Earnings & Deductions Breakdown
      doc.fillColor("#1e293b").fontSize(12).text("SALARY BREAKDOWN", { underline: true });
      doc.moveDown(0.5);

      doc.fontSize(10).fillColor("#0f172a");
      doc.text(`Basic Salary: ₹${(payrollRecord.basicSalary || 0).toLocaleString("en-IN")}`);
      doc.text(`Allowances (HRA, Food, Travel, Medical): ₹${(payrollRecord.allowances || 0).toLocaleString("en-IN")}`);
      doc.text(`Overtime Earnings: ₹${(payrollRecord.overtimeEarnings || 0).toLocaleString("en-IN")}`);
      if (payrollRecord.adjustmentsAddition > 0) {
        doc.text(`Bonus / Additions: ₹${payrollRecord.adjustmentsAddition.toLocaleString("en-IN")}`);
      }

      doc.moveDown(0.5);
      doc.fillColor("#b91c1c");
      doc.text(`Leave Deductions: ₹${(payrollRecord.leaveDeduction || 0).toLocaleString("en-IN")}`);
      doc.text(`Statutory Deductions (PF, ESI, PT, Tax): ₹${(payrollRecord.statutoryDeductions || 0).toLocaleString("en-IN")}`);
      doc.text(`Salary Advance Recovery: ₹${(payrollRecord.advanceRecovery || 0).toLocaleString("en-IN")}`);
      if (payrollRecord.adjustmentsDeduction > 0) {
        doc.text(`Other Deductions: ₹${payrollRecord.adjustmentsDeduction.toLocaleString("en-IN")}`);
      }

      doc.moveDown(1);
      doc.fontSize(14).fillColor("#047857").text(`GROSS SALARY: ₹${(payrollRecord.grossSalary || 0).toLocaleString("en-IN")}`);
      doc.fontSize(16).fillColor("#065f46").text(`NET PAYABLE SALARY: ₹${(payrollRecord.netSalary || 0).toLocaleString("en-IN")}`, { bold: true });

      doc.moveDown(2);
      doc.fontSize(8).fillColor("#94a3b8").text("This is a computer-generated payslip created by HostelMate SaaS Payroll Engine.", { align: "center" });

      doc.end();

      writeStream.on("finish", () => {
        const relativeUrl = `/uploads/payslips/${filename}`;
        resolve(relativeUrl);
      });

      writeStream.on("error", (err) => {
        logger.error("Payslip PDF write stream error:", err);
        reject(err);
      });
    } catch (error) {
      logger.error("PDF generation failed:", error);
      reject(error);
    }
  });
};

module.exports = { generatePayslipPDF };
