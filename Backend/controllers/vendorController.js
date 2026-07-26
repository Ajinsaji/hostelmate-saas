const vendorService = require("../services/vendorService");
const { createVendorSchema } = require("../validations/expenseValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const createVendor = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = createVendorSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const vendor = await vendorService.createVendor(value, userCtx);
    return res.status(201).json({ success: true, message: "Vendor Created", vendor });
  } catch (err) {
    logger.error("createVendor error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to create vendor" });
  }
};

const getVendors = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const vendors = await vendorService.getVendorsList(userCtx.hostelId);
    return res.status(200).json({ success: true, vendors });
  } catch (err) {
    logger.error("getVendors error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  createVendor,
  getVendors,
};
