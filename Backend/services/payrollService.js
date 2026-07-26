const mongoose = require("mongoose");
const PayrollPeriod = require("../models/PayrollPeriod");
const PayrollRecord = require("../models/PayrollRecord");
const PayrollException = require("../models/PayrollException");
const Payslip = require("../models/Payslip");
const SalaryStructure = require("../models/SalaryStructure");
const Staff = require("../models/Staff");
const Attendance = require("../models/Attendance");
const OvertimeRequest = require("../models/OvertimeRequest");
const LeaveRequest = require("../models/LeaveRequest");
const SalaryAdvance = require("../models/SalaryAdvance");
const PayrollAdjustment = require("../models/PayrollAdjustment");
const TreasuryLedger = require("../models/TreasuryLedger");
const Expense = require("../models/Expense");
const ExpenseCategory = require("../models/ExpenseCategory");
const AuditLog = require("../models/AuditLog");

const { getActivePolicy } = require("./payrollPolicyService");
const { generatePayslipPDF } = require("../utils/payslipGenerator");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const createPayrollPeriod = async (tenantId, month, year, createdBy) => {
  let period = await PayrollPeriod.findOne({ tenantId, month, year });
  if (!period) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    period = await PayrollPeriod.create({
      tenantId,
      month,
      year,
      startDate,
      endDate,
      status: "Open",
      processedBy: createdBy,
    });
  }
  return period;
};

const generatePayroll = async (tenantId, hostelId, month, year, generatedBy) => {
  const period = await createPayrollPeriod(tenantId, month, year, generatedBy);
  if (period.status === "Locked") {
    throw { statusCode: 400, message: "Payroll period is locked and cannot be re-generated" };
  }

  const policy = await getActivePolicy(tenantId);
  const activeStaff = await Staff.find({ tenantId, isDeleted: false, employmentStatus: "Active" });

  const startDate = period.startDate;
  const endDate = period.endDate;
  const daysInMonth = new Date(year, month, 0).getDate();

  const generatedRecords = [];

  for (const staff of activeStaff) {
    const structure = await SalaryStructure.findOne({ tenantId, staffId: staff._id, status: "Active" });
    if (!structure) {
      await PayrollException.create({
        tenantId,
        staffId: staff._id,
        exceptionType: "Missing Salary Structure",
        description: `Staff member ${staff.fullName} (${staff.employeeCode}) lacks an active salary structure.`,
      });
      continue;
    }

    // Read attendance for the month
    const attendanceRecords = await Attendance.find({
      tenantId,
      staffId: staff._id,
      attendanceDate: { $gte: startDate, $lte: endDate },
    });

    let presentDays = 0;
    let leaveDays = 0;
    let paidLeaveDays = 0;
    let unpaidLeaveDays = 0;
    let workingHours = 0;
    let overtimeHours = 0;

    attendanceRecords.forEach((att) => {
      if (att.attendanceStatus === "Present" || att.attendanceStatus === "Late") presentDays++;
      else if (att.attendanceStatus === "Leave") paidLeaveDays++;
      else if (att.attendanceStatus === "Absent") unpaidLeaveDays++;

      if (att.workingHours) workingHours += att.workingHours;
      if (att.overtimeHours) overtimeHours += att.overtimeHours;
    });

    // Approved overtime requests
    const approvedOvertime = await OvertimeRequest.find({
      tenantId,
      staffId: staff._id,
      status: "Approved",
      createdAt: { $gte: startDate, $lte: endDate },
    });
    let approvedOvertimeHours = 0;
    approvedOvertime.forEach((ot) => { approvedOvertimeHours += ot.hours; });

    // Allowances & Basic
    const basicSalary = structure.basicSalary || 0;
    const allowances =
      (structure.houseRentAllowance || 0) +
      (structure.foodAllowance || 0) +
      (structure.travelAllowance || 0) +
      (structure.medicalAllowance || 0) +
      (structure.otherAllowances || 0);

    // Overtime Earnings
    const hourlyRate = (basicSalary + allowances) / (daysInMonth * 8);
    const overtimeMultiplier = policy.overtimeMultiplier || 1.5;
    const overtimeEarnings = Math.round(approvedOvertimeHours * hourlyRate * overtimeMultiplier);

    // Leave Deductions (Proportional to unpaid leaves)
    const perDayRate = (basicSalary + allowances) / daysInMonth;
    const leaveDeduction = Math.round(unpaidLeaveDays * perDayRate);

    // Statutory Deductions
    const statutoryDeductions =
      (structure.providentFund || 0) +
      (structure.esi || 0) +
      (structure.professionalTax || 0) +
      (structure.incomeTax || 0) +
      (structure.otherDeductions || 0);

    // One-time Adjustments
    const adjustments = await PayrollAdjustment.find({ tenantId, staffId: staff._id, payrollPeriodId: period._id });
    let adjustmentsAddition = 0;
    let adjustmentsDeduction = 0;
    adjustments.forEach((adj) => {
      if (adj.type === "Addition") adjustmentsAddition += adj.amount;
      else if (adj.type === "Deduction") adjustmentsDeduction += adj.amount;
    });

    // Salary Advance Recovery
    const pendingAdvance = await SalaryAdvance.findOne({ tenantId, staffId: staff._id, status: "Approved" });
    const advanceRecovery = pendingAdvance ? Math.min(pendingAdvance.amount, basicSalary * 0.5) : 0;

    // Gross & Net Calculation
    const grossSalary = basicSalary + allowances + overtimeEarnings + adjustmentsAddition;
    const totalDeductions = leaveDeduction + statutoryDeductions + advanceRecovery + adjustmentsDeduction;
    const netSalary = grossSalary - totalDeductions;

    if (netSalary < 0) {
      await PayrollException.create({
        tenantId,
        staffId: staff._id,
        exceptionType: "Negative Salary",
        description: `Net salary calculation for ${staff.fullName} produced negative value (₹${netSalary}).`,
      });
    }

    let record = await PayrollRecord.findOne({ tenantId, payrollPeriodId: period._id, staffId: staff._id });
    if (!record) {
      record = new PayrollRecord({
        tenantId,
        hostelId: hostelId || staff.hostelId || tenantId,
        staffId: staff._id,
        payrollPeriodId: period._id,
      });
    }

    record.attendanceDays = daysInMonth;
    record.presentDays = presentDays;
    record.leaveDays = leaveDays;
    record.paidLeaveDays = paidLeaveDays;
    record.unpaidLeaveDays = unpaidLeaveDays;
    record.workingHours = workingHours;
    record.overtimeHours = approvedOvertimeHours;
    record.basicSalary = basicSalary;
    record.allowances = allowances;
    record.overtimeEarnings = overtimeEarnings;
    record.adjustmentsAddition = adjustmentsAddition;
    record.leaveDeduction = leaveDeduction;
    record.statutoryDeductions = statutoryDeductions;
    record.advanceRecovery = advanceRecovery;
    record.adjustmentsDeduction = adjustmentsDeduction;
    record.deductions = totalDeductions;
    record.grossSalary = grossSalary;
    record.netSalary = Math.max(netSalary, 0);
    record.status = "Draft";
    record.generatedBy = generatedBy;

    await record.save();
    generatedRecords.push(record);
  }

  period.status = "Processing";
  period.processedAt = new Date();
  await period.save();

  await AuditLog.create({
    hostelId,
    userId: generatedBy,
    action: "Payroll Generated",
    actionType: "CREATE",
    entity: "PayrollPeriod",
    targetId: period._id,
    targetModel: "PayrollPeriod",
    details: { month, year, recordsCount: generatedRecords.length },
  });

  return { period, records: generatedRecords };
};

const approvePayroll = async (tenantId, payrollPeriodId, approvedBy) => {
  const records = await PayrollRecord.find({ tenantId, payrollPeriodId, status: "Draft" });
  for (const r of records) {
    r.status = "Approved";
    r.approvedBy = approvedBy;
    await r.save();
  }

  await AuditLog.create({
    userId: approvedBy,
    action: "Payroll Approved",
    actionType: "UPDATE",
    entity: "PayrollPeriod",
    targetId: payrollPeriodId,
    targetModel: "PayrollPeriod",
  });

  return records;
};

const lockPayroll = async (tenantId, payrollPeriodId, lockedBy) => {
  const period = await PayrollPeriod.findOne({ _id: payrollPeriodId, tenantId });
  if (!period) {
    throw { statusCode: 404, message: "Payroll period not found" };
  }

  period.status = "Locked";
  period.lockedBy = lockedBy;
  period.lockedAt = new Date();
  await period.save();

  await AuditLog.create({
    userId: lockedBy,
    action: "Payroll Locked",
    actionType: "UPDATE",
    entity: "PayrollPeriod",
    targetId: period._id,
    targetModel: "PayrollPeriod",
  });

  return period;
};

const paySalary = async (tenantId, payrollRecordId, paidBy) => {
  const record = await PayrollRecord.findOne({ _id: payrollRecordId, tenantId }).populate({
    path: "staffId",
    populate: { path: "userId" },
  });

  if (!record) {
    throw { statusCode: 404, message: "Payroll record not found" };
  }

  if (record.status === "Paid") {
    throw { statusCode: 400, message: "Salary already paid for this record" };
  }

  const staff = record.staffId;
  const hostelId = record.hostelId || tenantId;

  try {
    // 1. Create Treasury Outflow Transaction
    const treasuryEntry = await TreasuryLedger.create({
      tenantId,
      hostelId,
      transactionDate: new Date(),
      accountType: "Bank",
      transactionType: "Payment",
      referenceType: "Payroll",
      referenceId: record._id,
      debit: 0,
      credit: record.netSalary,
      createdBy: paidBy,
      remarks: `Salary payment for ${staff.fullName} (${record.payrollPeriodId})`,
    });

    // 2. Create Salary Expense record
    let category = await ExpenseCategory.findOne({ tenantId, categoryName: "Payroll & Salaries" });
    if (!category) {
      category = await ExpenseCategory.create({
        tenantId,
        hostelId,
        categoryName: "Payroll & Salaries",
        categoryCode: "EXP-PAYROLL",
        description: "Staff monthly salaries and payroll expense",
      });
    }

    const expense = await Expense.create({
      tenantId,
      hostelId,
      expenseNumber: `EXP-SAL-${Date.now().toString().slice(-6)}`,
      expenseDate: new Date(),
      categoryId: category._id,
      title: `Salary Payment - ${staff.fullName}`,
      amount: record.netSalary,
      paymentMethod: "Bank Transfer",
      status: "Paid",
      expenseType: "One Time",
      createdBy: paidBy,
    });

    // 3. Generate Payslip PDF Document
    const pdfUrl = await generatePayslipPDF(record, staff, { name: "HostelMate Enterprise" });
    const payslip = await Payslip.create({
      tenantId,
      payrollRecordId: record._id,
      pdfUrl,
      generatedAt: new Date(),
    });

    // 4. Mark Salary Advance Recovered if applicable
    if (record.advanceRecovery > 0) {
      const advance = await SalaryAdvance.findOne({ tenantId, staffId: staff._id, status: "Approved" });
      if (advance) {
        advance.status = "Recovered";
        advance.recoveredInPayroll = record._id;
        await advance.save();
      }
    }

    // 5. Update Payroll Record to Paid
    record.status = "Paid";
    record.paidBy = paidBy;
    record.paymentDate = new Date();
    record.treasuryTransactionId = treasuryEntry._id;
    record.expenseId = expense._id;
    await record.save();

    await AuditLog.create({
      hostelId,
      userId: paidBy,
      action: "Salary Paid",
      actionType: "UPDATE",
      entity: "PayrollRecord",
      targetId: record._id,
      targetModel: "PayrollRecord",
      details: { netSalary: record.netSalary, staffName: staff.fullName },
    });

    if (staff?.userId?._id) {
      try {
        await publishNotification({
          userId: staff.userId._id,
          hostelId,
          type: "system_update",
          title: "Salary Paid & Payslip Available",
          message: `Your net salary of ₹${record.netSalary.toLocaleString("en-IN")} has been processed`,
          meta: { route: "/my-payroll" },
        });
      } catch (e) {
        logger.error("Salary paid notification error:", e?.message);
      }
    }

    return { record, treasuryEntry, expense, payslip };
  } catch (error) {
    logger.error("PAY SALARY TRANSACTION FAILED:", error?.stack || error?.message || error);
    await PayrollException.create({
      tenantId,
      payrollRecordId: record._id,
      staffId: staff._id,
      exceptionType: "Treasury Failure",
      description: `Salary payment transaction failed: ${error.message || error}`,
    });
    throw { statusCode: 500, message: `Salary payment transaction failed (${error.message || error}). Payroll exception logged.` };
  }
};

const getPayrollSummary = async (tenantId, month, year) => {
  const period = await PayrollPeriod.findOne({ tenantId, month, year });
  if (!period) return { records: [], totalGross: 0, totalNet: 0 };

  const records = await PayrollRecord.find({ tenantId, payrollPeriodId: period._id })
    .populate({ path: "staffId", select: "fullName employeeCode photo designation" })
    .sort({ createdAt: -1 });

  let totalGross = 0;
  let totalNet = 0;
  let totalOvertime = 0;
  let totalDeductions = 0;

  records.forEach((r) => {
    totalGross += r.grossSalary || 0;
    totalNet += r.netSalary || 0;
    totalOvertime += r.overtimeEarnings || 0;
    totalDeductions += r.deductions || 0;
  });

  return {
    period,
    records,
    totalGross,
    totalNet,
    totalOvertime,
    totalDeductions,
    totalRecords: records.length,
  };
};

module.exports = {
  createPayrollPeriod,
  generatePayroll,
  approvePayroll,
  lockPayroll,
  paySalary,
  getPayrollSummary,
};
