const PayrollAdjustment = require("../models/PayrollAdjustment");
const { logger } = require("../utils/logger");

const createAdjustment = async (tenantId, adjustmentData, createdBy) => {
  const adjustment = await PayrollAdjustment.create({
    tenantId,
    ...adjustmentData,
    createdBy,
    approvedBy: createdBy,
  });

  return adjustment;
};

const getAdjustmentsForStaff = async (tenantId, staffId, payrollPeriodId = null) => {
  const query = { tenantId, staffId };
  if (payrollPeriodId) query.payrollPeriodId = payrollPeriodId;
  return PayrollAdjustment.find(query);
};

module.exports = {
  createAdjustment,
  getAdjustmentsForStaff,
};
