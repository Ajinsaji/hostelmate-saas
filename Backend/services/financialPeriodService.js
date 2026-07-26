const FinancialPeriod = require("../models/FinancialPeriod");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

async function isPeriodLocked(hostelId, targetDate = new Date()) {
  const d = new Date(targetDate);
  const month = d.getMonth() + 1;
  const year = d.getFullYear();

  const period = await FinancialPeriod.findOne({ hostelId, month, year });
  if (!period) return false;

  return period.status === "Closed" || period.status === "Locked";
}

async function assertPeriodOpen(hostelId, targetDate = new Date()) {
  const locked = await isPeriodLocked(hostelId, targetDate);
  if (locked) {
    const d = new Date(targetDate);
    const mName = d.toLocaleString("default", { month: "long", year: "numeric" });
    throw new Error(`Financial period '${mName}' is Closed/Locked. Historical accounting records cannot be modified without Super Admin unlock.`);
  }
}

async function closePeriod({ hostelId, month, year, remarks = "" }, userContext = {}) {
  let period = await FinancialPeriod.findOne({ hostelId, month, year });

  if (period) {
    period.status = "Closed";
    period.closedBy = userContext.userId || null;
    period.closedDate = new Date();
    if (remarks) period.remarks = remarks;
    await period.save();
  } else {
    period = await FinancialPeriod.create({
      tenantId: hostelId,
      hostelId,
      month,
      year,
      status: "Closed",
      closedBy: userContext.userId || null,
      closedDate: new Date(),
      remarks,
    });
  }

  await AuditLog.create({
    hostelId,
    userId: userContext.userId || null,
    action: `Closed Financial Period for ${month}/${year}`,
    actionType: "PERIOD_CLOSE",
    entity: "FinancialPeriod",
    targetId: period._id,
    targetModel: "FinancialPeriod",
    timestamp: new Date(),
  });

  return period;
}

async function unlockPeriod({ hostelId, month, year, remarks = "" }, userContext = {}) {
  let period = await FinancialPeriod.findOne({ hostelId, month, year });

  if (!period) {
    throw new Error("Financial period record not found");
  }

  period.status = "Open";
  period.unlockedBy = userContext.userId || null;
  period.unlockedDate = new Date();
  if (remarks) period.remarks = `${period.remarks || ""}\n[Unlocked]: ${remarks}`.trim();
  await period.save();

  await AuditLog.create({
    hostelId,
    adminId: userContext.userId || null,
    action: `Super Admin Unlocked Financial Period for ${month}/${year}`,
    actionType: "PERIOD_UNLOCK",
    entity: "FinancialPeriod",
    targetId: period._id,
    targetModel: "FinancialPeriod",
    timestamp: new Date(),
  });

  return period;
}

async function getFinancialPeriods(hostelId) {
  return await FinancialPeriod.find({ hostelId }).sort({ year: -1, month: -1 });
}

module.exports = {
  isPeriodLocked,
  assertPeriodOpen,
  closePeriod,
  unlockPeriod,
  getFinancialPeriods,
};
