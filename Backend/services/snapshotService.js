const AnalyticsSnapshot = require("../models/AnalyticsSnapshot");
const Resident = require("../models/Resident");
const Bed = require("../models/Bed");
const RentPayment = require("../models/RentPayment");
const Expense = require("../models/Expense");
const TreasuryLedger = require("../models/TreasuryLedger");
const PayrollRecord = require("../models/PayrollRecord");
const Staff = require("../models/Staff");
const Attendance = require("../models/Attendance");
const { logger } = require("../utils/logger");

const captureDailySnapshot = async (tenantId, hostelId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalBeds = await Bed.countDocuments({ tenantId, isDeleted: false });
  const occupiedBeds = await Bed.countDocuments({ tenantId, isOccupied: true, isDeleted: false });
  const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  const residentCount = await Resident.countDocuments({ tenantId, isDeleted: false, status: "Active" });
  const staffCount = await Staff.countDocuments({ tenantId, isDeleted: false, employmentStatus: "Active" });

  // Month-to-date revenue & expense
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const revenueDocs = await RentPayment.aggregate([
    { $match: { tenantId, paymentDate: { $gte: startOfMonth } } },
    { $group: { _id: null, total: { $sum: "$amountPaid" } } },
  ]);
  const revenue = revenueDocs[0]?.total || 0;

  const expenseDocs = await Expense.aggregate([
    { $match: { tenantId, expenseDate: { $gte: startOfMonth }, isDeleted: false } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const expenses = expenseDocs[0]?.total || 0;

  const profit = revenue - expenses;

  // Treasury
  const treasuryDocs = await TreasuryLedger.aggregate([
    { $match: { tenantId } },
    { $group: { _id: null, debit: { $sum: "$debit" }, credit: { $sum: "$credit" } } },
  ]);
  const treasuryBalance = (treasuryDocs[0]?.debit || 0) - (treasuryDocs[0]?.credit || 0);

  const snapshot = await AnalyticsSnapshot.create({
    tenantId,
    hostelId: hostelId || tenantId,
    snapshotDate: today,
    snapshotType: "Daily",
    occupancy,
    revenue,
    expenses,
    profit,
    treasuryBalance,
    residentCount,
    staffCount,
  });

  return snapshot;
};

const getRecentSnapshots = async (tenantId, limit = 30) => {
  return AnalyticsSnapshot.find({ tenantId, snapshotType: "Daily" }).sort({ snapshotDate: -1 }).limit(limit);
};

module.exports = {
  captureDailySnapshot,
  getRecentSnapshots,
};
