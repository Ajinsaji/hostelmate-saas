const RolePermission = require("../models/RolePermission");
const { logger } = require("../utils/logger");

const DEFAULT_PERMISSIONS = {
  Owner: {
    dashboard: { view: true },
    rooms: { view: true, create: true, edit: true, delete: true },
    residents: { view: true, create: true, edit: true, delete: true },
    payments: { view: true, collect: true, refund: true },
    food: { view: true, manage: true },
    expenses: { view: true, create: true, edit: true },
    procurement: { view: true, manage: true },
    accountsPayable: { view: true, manage: true },
    treasury: { view: true, manage: true },
    reports: { view: true, export: true },
    staff: { view: true, create: true, edit: true, delete: true },
    payroll: { view: true, process: true },
    settings: { view: true, edit: true },
  },
  Warden: {
    dashboard: { view: true },
    rooms: { view: true, create: true, edit: true, delete: false },
    residents: { view: true, create: true, edit: true, delete: false },
    payments: { view: true, collect: true, refund: false },
    food: { view: false, manage: false },
    expenses: { view: false, create: false, edit: false },
    procurement: { view: false, manage: false },
    accountsPayable: { view: false, manage: false },
    treasury: { view: false, manage: false },
    reports: { view: false, export: false },
    staff: { view: false, create: false, edit: false, delete: false },
    payroll: { view: false, process: false },
    settings: { view: false, edit: false },
  },
  Cook: {
    dashboard: { view: true },
    rooms: { view: false, create: false, edit: false, delete: false },
    residents: { view: false, create: false, edit: false, delete: false },
    payments: { view: false, collect: false, refund: false },
    food: { view: true, manage: true },
    expenses: { view: false, create: false, edit: false },
    procurement: { view: false, manage: false },
    accountsPayable: { view: false, manage: false },
    treasury: { view: false, manage: false },
    reports: { view: false, export: false },
    staff: { view: false, create: false, edit: false, delete: false },
    payroll: { view: false, process: false },
    settings: { view: false, edit: false },
  },
  Accountant: {
    dashboard: { view: true },
    rooms: { view: false, create: false, edit: false, delete: false },
    residents: { view: false, create: false, edit: false, delete: false },
    payments: { view: true, collect: true, refund: true },
    food: { view: false, manage: false },
    expenses: { view: true, create: true, edit: true },
    procurement: { view: false, manage: false },
    accountsPayable: { view: true, manage: true },
    treasury: { view: true, manage: true },
    reports: { view: true, export: true },
    staff: { view: false, create: false, edit: false, delete: false },
    payroll: { view: false, process: false },
    settings: { view: false, edit: false },
  },
};

const normalizeRole = (role) => {
  if (!role) return "Warden";
  const lower = role.toLowerCase();
  if (lower === "owner") return "Owner";
  if (lower === "warden") return "Warden";
  if (lower === "cook") return "Cook";
  if (lower === "accountant") return "Accountant";
  return role.charAt(0).toUpperCase() + role.slice(1);
};

const seedDefaultRoles = async (tenantId) => {
  try {
    const roles = ["Owner", "Warden", "Cook", "Accountant"];
    for (const r of roles) {
      const existing = await RolePermission.findOne({ tenantId, role: r });
      if (!existing) {
        await RolePermission.create({
          tenantId,
          role: r,
          permissions: DEFAULT_PERMISSIONS[r],
        });
      }
    }
  } catch (error) {
    logger.error("SEED DEFAULT ROLES ERROR:", error?.message || error);
  }
};

const getRolePermissions = async (tenantId) => {
  await seedDefaultRoles(tenantId);
  return RolePermission.find({ tenantId });
};

const updateRolePermissions = async (tenantId, role, updatedPermissions) => {
  const normRole = normalizeRole(role);
  if (normRole === "Owner") {
    throw new Error("Owner permissions cannot be altered");
  }

  let record = await RolePermission.findOne({ tenantId, role: normRole });
  if (!record) {
    record = new RolePermission({ tenantId, role: normRole, permissions: DEFAULT_PERMISSIONS[normRole] });
  }

  record.permissions = { ...record.permissions.toObject?.() || record.permissions, ...updatedPermissions };
  await record.save();
  return record;
};

const canAccessModule = async (tenantId, role, moduleName, action = "view") => {
  const normRole = normalizeRole(role);
  if (normRole === "Owner") return true;

  if (!tenantId) return true; // Fallback if un-scoped owner/system check

  let record = await RolePermission.findOne({ tenantId, role: normRole });
  if (!record) {
    await seedDefaultRoles(tenantId);
    record = await RolePermission.findOne({ tenantId, role: normRole });
  }

  if (!record || !record.permissions) return false;

  const modulePerms = record.permissions[moduleName];
  if (!modulePerms) return false;

  if (typeof modulePerms === "boolean") return modulePerms;
  if (typeof modulePerms[action] === "boolean") return modulePerms[action];
  if (typeof modulePerms.view === "boolean") return modulePerms.view;

  return false;
};

module.exports = {
  DEFAULT_PERMISSIONS,
  normalizeRole,
  seedDefaultRoles,
  getRolePermissions,
  updateRolePermissions,
  canAccessModule,
};
