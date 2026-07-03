const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");
const Room = require("../models/Room");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const { generateWhatsAppURL, generateStaffWhatsAppMessage } = require("../utils/messageService");

const createStaff = async (req, res) => {
  try {
    const { fullName, phone, username, password, role } = req.body || {};
    const { userId, hostelId } = req.user;

    if (!fullName || !phone || !username || !password || !role) {
      return res.status(400).json({ success: false, message: "All staff fields are required" });
    }

    if (!["warden", "cook"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be warden or cook" });
    }

    const existingUsername = await Staff.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username is already taken" });
    }

    const existingPhone = await Staff.findOne({ phone, hostelId });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: "A staff member with this phone already exists for this hostel" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const staff = await Staff.create({
      hostelId,
      role,
      fullName,
      phone,
      username,
      passwordHash,
      createdByOwner: userId,
    });

    const loginUrl = process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app/login";
    const message = generateStaffWhatsAppMessage(fullName, role, username, password, loginUrl);
    const whatsappURL = generateWhatsAppURL(phone, message);

    // NOTIFICATION: Staff added
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Owner = require("../models/Owner");
      const owner = await Owner.findOne({ hostelId, role: "owner" });
      if (owner?._id) {
        await publishNotification({
          userId: owner._id,
          hostelId,
          type: "staff_added",
          title: `${fullName} Added as ${role.charAt(0).toUpperCase() + role.slice(1)}`,
          message: `New staff member ${fullName} has been added`,
          meta: { route: "/staff", relatedId: staff._id },
        });
      }
    } catch (e) {
      console.error("Staff added notification failed:", e?.message || e);
    }

    return res.status(201).json({
      success: true,
      message: "Staff created successfully",
      staff,
      whatsappURL,
    });
  } catch (error) {
    console.error("CREATE STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to create staff", details: error.message });
  }
};

const getStaffByHostel = async (req, res) => {
  try {
    const { hostelId } = req.user;
    const staff = await Staff.find({ hostelId }).sort({ role: 1, fullName: 1 });
    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("GET STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load staff", details: error.message });
  }
};

const updateStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { fullName, phone, username, role } = req.body || {};
    const { hostelId } = req.user;

    const staff = await Staff.findOne({ _id: staffId, hostelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    if (role && !["warden", "cook"].includes(role)) {
      return res.status(400).json({ success: false, message: "Role must be warden or cook" });
    }

    if (username && username !== staff.username) {
      const existingUsername = await Staff.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ success: false, message: "Username is already taken" });
      }
    }

    if (phone && phone !== staff.phone) {
      const existingPhone = await Staff.findOne({ phone, hostelId, _id: { $ne: staffId } });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: "A staff member with this phone already exists" });
      }
    }

    staff.fullName = fullName || staff.fullName;
    staff.phone = phone || staff.phone;
    staff.username = username || staff.username;
    staff.role = role || staff.role;

    await staff.save();

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("UPDATE STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update staff", details: error.message });
  }
};

const resetStaffPassword = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { newPassword } = req.body || {};
    const { hostelId } = req.user;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "newPassword is required" });
    }

    const staff = await Staff.findOne({ _id: staffId, hostelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    staff.passwordHash = await bcrypt.hash(newPassword, 10);
    await staff.save();

    const loginUrl = process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app/login";
    const message = generateStaffWhatsAppMessage(staff.fullName, staff.role, staff.username, newPassword, loginUrl);
    const whatsappURL = generateWhatsAppURL(staff.phone, message);

    return res.status(200).json({ success: true, message: "Password reset successfully", staff, whatsappURL });
  } catch (error) {
    console.error("RESET STAFF PASSWORD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to reset password", details: error.message });
  }
};

const updateStaffStatus = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { isActive } = req.body || {};
    const { hostelId } = req.user;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be boolean" });
    }

    const staff = await Staff.findOne({ _id: staffId, hostelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    staff.isActive = isActive;
    await staff.save();

    return res.status(200).json({ success: true, staff });
  } catch (error) {
    console.error("UPDATE STAFF STATUS ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to update staff status", details: error.message });
  }
};

const deleteStaff = async (req, res) => {
  try {
    const staffId = req.params.id;
    const { hostelId } = req.user;

    const staff = await Staff.findOneAndDelete({ _id: staffId, hostelId });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff member not found" });
    }

    // NOTIFICATION: Staff removed
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Owner = require("../models/Owner");
      const owner = await Owner.findOne({ hostelId, role: "owner" });
      if (owner?._id) {
        await publishNotification({
          userId: owner._id,
          hostelId,
          type: "staff_removed",
          title: `${staff.fullName} Removed`,
          message: `Staff member ${staff.fullName} has been removed`,
          meta: { route: "/staff" },
        });
      }
    } catch (e) {
      console.error("Staff removed notification failed:", e?.message || e);
    }

    return res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("DELETE STAFF ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to delete staff", details: error.message });
  }
};

const getStaffDashboard = async (req, res) => {
  try {
    const { role, hostelId } = req.user;

    if (role === "warden") {
      const rooms = await Room.find({ hostelId });
      let totalBeds = 0;
      rooms.forEach((room) => { totalBeds += room.totalBeds || 0; });
      const occupiedBeds = await Resident.countDocuments({ hostelId, status: "active" });
      const vacantBeds = Math.max(totalBeds - occupiedBeds, 0);

      const pendingPayments = await Payment.aggregate([
        { $match: { hostelId, status: { $in: ["pending", "partial"] } } },
        { $group: { _id: null, total: { $sum: "$balance" } } },
      ]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const payments = await Payment.find({ hostelId });
      let todayCollection = 0;
      payments.forEach((payment) => {
        payment.entries.forEach((entry) => {
          if (entry.createdAt >= today && entry.createdAt < tomorrow) {
            todayCollection += entry.amount;
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

    if (role === "cook") {
      return res.status(200).json({
        success: true,
        stats: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          vacationMode: 0,
        },
      });
    }

    return res.status(403).json({ success: false, message: "Forbidden" });
  } catch (error) {
    console.error("STAFF DASHBOARD ERROR:", error);
    return res.status(500).json({ success: false, message: "Unable to load dashboard", details: error.message });
  }
};

module.exports = {
  createStaff,
  getStaffByHostel,
  updateStaff,
  resetStaffPassword,
  updateStaffStatus,
  deleteStaff,
  getStaffDashboard,
};
