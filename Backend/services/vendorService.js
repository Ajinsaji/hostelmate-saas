const Vendor = require("../models/Vendor");
const Expense = require("../models/Expense");
const { logger } = require("../utils/logger");

async function generateVendorCode(hostelId) {
  const count = await Vendor.countDocuments({ hostelId });
  const seq = String(count + 1).padStart(3, "0");
  return `VND-${seq}`;
}

async function createVendor(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  const vendorCode = data.vendorCode || (await generateVendorCode(hostelId));

  const vendor = await Vendor.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    vendorCode,
    createdBy: userContext.userId,
  });

  return vendor;
}

async function getVendorsList(hostelId) {
  const vendors = await Vendor.find({ hostelId, status: "Active" }).sort({ vendorName: 1 });

  // Calculate total spent & outstanding bills for each vendor
  const vendorsWithMetrics = await Promise.all(
    vendors.map(async (v) => {
      const expenses = await Expense.find({ vendorId: v._id, isDeleted: false });
      const totalSpent = expenses.reduce((sum, e) => sum + (e.netAmount || 0), 0);
      const pendingBills = expenses.filter((e) => e.status === "Pending Approval" || e.status === "Draft").length;

      return {
        ...v.toObject(),
        totalSpent,
        pendingBills,
      };
    })
  );

  return vendorsWithMetrics;
}

module.exports = {
  createVendor,
  getVendorsList,
};
