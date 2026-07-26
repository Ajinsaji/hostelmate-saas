const mongoose = require("mongoose");

const rolePermissionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hostel",
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["Owner", "Warden", "Cook", "Accountant"],
    },
    permissions: {
      dashboard: {
        view: { type: Boolean, default: true },
      },
      rooms: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      residents: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      payments: {
        view: { type: Boolean, default: false },
        collect: { type: Boolean, default: false },
        refund: { type: Boolean, default: false },
      },
      food: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
      expenses: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
      procurement: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
      accountsPayable: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
      treasury: {
        view: { type: Boolean, default: false },
        manage: { type: Boolean, default: false },
      },
      reports: {
        view: { type: Boolean, default: false },
        export: { type: Boolean, default: false },
      },
      staff: {
        view: { type: Boolean, default: false },
        create: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
      payroll: {
        view: { type: Boolean, default: false },
        process: { type: Boolean, default: false },
      },
      settings: {
        view: { type: Boolean, default: false },
        edit: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

rolePermissionSchema.index({ tenantId: 1, role: 1 }, { unique: true });

module.exports = mongoose.model("RolePermission", rolePermissionSchema);
