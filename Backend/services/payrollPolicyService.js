const PayrollPolicy = require("../models/PayrollPolicy");
const { logger } = require("../utils/logger");

const seedDefaultPolicy = async (tenantId, createdBy) => {
  let policy = await PayrollPolicy.findOne({ tenantId, status: "Active" });
  if (!policy) {
    policy = await PayrollPolicy.create({
      tenantId,
      salaryCalculationType: "Monthly",
      lateDeductionPolicy: "None",
      overtimeCalculationType: "Hourly",
      overtimeMultiplier: 1.5,
      graceMinutes: 15,
      leaveDeductionPolicy: "Proportional",
      roundingRule: "Nearest",
      currency: "INR",
      payrollFrequency: "Monthly",
      status: "Active",
      createdBy,
    });
  }
  return policy;
};

const getActivePolicy = async (tenantId) => {
  let policy = await PayrollPolicy.findOne({ tenantId, status: "Active" });
  if (!policy) {
    policy = await seedDefaultPolicy(tenantId);
  }
  return policy;
};

const updatePolicy = async (tenantId, updateData, updatedBy) => {
  // Deactivate old policies to maintain revision history
  await PayrollPolicy.updateMany({ tenantId, status: "Active" }, { $set: { status: "Inactive" } });

  const newPolicy = await PayrollPolicy.create({
    tenantId,
    ...updateData,
    status: "Active",
    createdBy: updatedBy,
  });

  return newPolicy;
};

module.exports = {
  seedDefaultPolicy,
  getActivePolicy,
  updatePolicy,
};
