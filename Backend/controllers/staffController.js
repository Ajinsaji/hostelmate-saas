const staffService = require("../services/staffService");
const Room = require("../models/Room");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const Expense = require("../models/Expense");
const TreasuryLedger = require("../models/TreasuryLedger");
const { logger } = require("../utils/logger");

const createStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.body.hostelId || req.user.hostelId || tenantId;
    const createdBy = req.user.userId || req.user.id;

    const result = await staffService.createStaff(tenantId, hostelId, req.body, createdBy);
    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff: result.staff,
      user: result.user,
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    logger.error("CREATE STAFF CONTROLLER ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to create staff" });
  }
};

const getStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { role, status, hostelId } = req.query;

    const staffList = await staffService.getStaff(tenantId, { role, status, hostelId });
    return res.status(200).json({ success: true, staff: staffList });
  } catch (error) {
    logger.error("GET STAFF CONTROLLER ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load staff list" });
  }
};

const getStaffById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const staff = await staffService.getStaffById(tenantId, req.params.id);
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    logger.error("GET STAFF BY ID ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Staff member not found" });
  }
};

const getStaffProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await staffService.getStaffProfile(userId);
    return res.status(200).json({ success: true, profile: result });
  } catch (error) {
    logger.error("GET STAFF PROFILE ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Unable to fetch profile" });
  }
};

const updateStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const updatedBy = req.user.userId || req.user.id;
    const updated = await staffService.updateStaff(tenantId, req.params.id, req.body, updatedBy);
    return res.status(200).json({ success: true, message: "Staff details updated", staff: updated });
  } catch (error) {
    logger.error("UPDATE STAFF ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to update staff" });
  }
};

const toggleStatus = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const updatedBy = req.user.userId || req.user.id;
    const { status, isActive } = req.body;
    const newStatus = status || (isActive ? "Active" : "Inactive");

    const updated = await staffService.toggleStatus(tenantId, req.params.id, newStatus, updatedBy);
    return res.status(200).json({ success: true, message: "Staff status updated", staff: updated });
  } catch (error) {
    logger.error("TOGGLE STATUS ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to update status" });
  }
};

const resetPassword = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const resetBy = req.user.userId || req.user.id;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "newPassword is required" });
    }

    const result = await staffService.resetPassword(tenantId, req.params.id, newPassword, resetBy);
    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      staff: result.staff,
      whatsappURL: result.whatsappURL,
    });
  } catch (error) {
    logger.error("RESET PASSWORD ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to reset password" });
  }
};

const changeSelfPassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "oldPassword and newPassword are required" });
    }

    const result = await staffService.changeSelfPassword(userId, oldPassword, newPassword);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error("CHANGE SELF PASSWORD ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to change password" });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const deletedBy = req.user.userId || req.user.id;
    const result = await staffService.deleteStaff(tenantId, req.params.id, deletedBy);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.error("DELETE STAFF ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to delete staff" });
  }
};

const getStaffActivity = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const logs = await staffService.getStaffActivity(tenantId, req.params.id);
    return res.status(200).json({ success: true, activity: logs });
  } catch (error) {
    logger.error("GET STAFF ACTIVITY ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Unable to fetch staff activity" });
  }
};

const getStaffDashboard = async (req, res) => {
  try {
    const { role, hostelId, tenantId } = req.user;
    const activeHostelId = hostelId || tenantId;
    const userRole = role ? role.toLowerCase() : "";

    if (userRole === "warden") {
      const rooms = await Room.find({ hostelId: activeHostelId });
      let totalBeds = 0;
      rooms.forEach((room) => { totalBeds += room.totalBeds || 0; });
      const occupiedBeds = await Resident.countDocuments({ hostelId: activeHostelId, status: "active" });
      const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);

      const pendingPayments = await Payment.aggregate([
        { $match: { hostelId: activeHostelId, status: { $in: ["pending", "partial"] } } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const payments = await Payment.find({ hostelId: activeHostelId });
      let todayCollection = 0;
      payments.forEach((payment) => {
        payment.entries?.forEach((entry) => {
          if (entry.createdAt >= today && entry.createdAt < tomorrow) {
            todayCollection += entry.amount || 0;
          }
        });
      });

      return res.status(200).json({
        success: true,
        stats: {
          residents: occupiedBeds,
          pendingDues: pendingPayments[0]?.total || 0,
          vacantBeds,
          todayCollection,
        },
      });
    }

    if (userRole === "cook") {
      return res.status(200).json({
        success: true,
        stats: {
          breakfast: 45,
          lunch: 52,
          dinner: 48,
          vegCount: 35,
          nonVegCount: 17,
          guestMeals: 5,
          extraMeals: 3,
          lowStockCount: 2,
          foodWastageKg: 1.5,
        },
      });
    }

    if (userRole === "accountant") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const payments = await Payment.find({ hostelId: activeHostelId });
      let todayCollection = 0;
      payments.forEach((payment) => {
        payment.entries?.forEach((entry) => {
          if (entry.createdAt >= today && entry.createdAt < tomorrow) {
            todayCollection += entry.amount || 0;
          }
        });
      });

      const outstanding = await Payment.aggregate([
        { $match: { hostelId: activeHostelId, status: { $in: ["pending", "partial"] } } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]);

      const todayExpenses = await Expense.aggregate([
        { $match: { hostelId: activeHostelId, expenseDate: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]);

      return res.status(200).json({
        success: true,
        stats: {
          todayCollection,
          outstandingRent: outstanding[0]?.total || 0,
          todayExpenses: todayExpenses[0]?.total || 0,
          bankBalance: 125000,
          vendorBillsPending: 3,
        },
      });
    }

    return res.status(403).json({ success: false, message: "Role dashboard not available for this role" });
  } catch (error) {
    logger.error("STAFF DASHBOARD ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load staff dashboard" });
  }
};

module.exports = {
  createStaff,
  getStaff,
  getStaffById,
  getStaffProfile,
  updateStaff,
  toggleStatus,
  resetPassword,
  changeSelfPassword,
  deleteStaff,
  getStaffActivity,
  getStaffDashboard,
};
