const SalaryStructure = require("../models/SalaryStructure");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");

const createSalaryStructure = async (tenantId, structureData, createdBy) => {
  const { staffId } = structureData;

  // Deactivate previous active structure for staff
  await SalaryStructure.updateMany({ tenantId, staffId, status: "Active" }, { $set: { status: "Inactive" } });

  const structure = await SalaryStructure.create({
    tenantId,
    ...structureData,
    status: "Active",
    createdBy,
  });

  await AuditLog.create({
    userId: createdBy,
    action: "Salary Structure Created",
    actionType: "CREATE",
    entity: "SalaryStructure",
    targetId: structure._id,
    targetModel: "SalaryStructure",
    details: { staffId, basicSalary: structure.basicSalary },
  });

  return structure;
};

const getSalaryStructure = async (tenantId, staffId) => {
  const structure = await SalaryStructure.findOne({ tenantId, staffId, status: "Active", isDeleted: false });
  return structure;
};

const getSalaryStructureHistory = async (tenantId, staffId) => {
  return SalaryStructure.find({ tenantId, staffId, isDeleted: false }).sort({ createdAt: -1 });
};

module.exports = {
  createSalaryStructure,
  getSalaryStructure,
  getSalaryStructureHistory,
};
