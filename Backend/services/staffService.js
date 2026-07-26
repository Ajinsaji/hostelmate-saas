const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Staff = require("../models/Staff");
const AuditLog = require("../models/AuditLog");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");
const { generateWhatsAppURL, generateStaffWhatsAppMessage } = require("../utils/messageService");
const { normalizeRole } = require("./permissionService");

const generateEmployeeCode = async (tenantId) => {
  const count = await Staff.countDocuments({ tenantId });
  const num = (count + 1).toString().padStart(3, "0");
  return `EMP-${num}`;
};

const createStaff = async (tenantId, hostelId, staffData, createdBy) => {
  const { fullName, email, phone, role, designation, joiningDate, salary, address, photo, password } = staffData;
  const normalizedRole = normalizeRole(role);

  // Check unique email and phone within the tenant
  const existingEmail = await User.findOne({ tenantId, email: email.toLowerCase() });
  if (existingEmail) {
    throw { statusCode: 409, message: "A user with this email already exists in this tenant" };
  }

  const existingPhone = await User.findOne({ tenantId, phone });
  if (existingPhone) {
    throw { statusCode: 409, message: "A user with this mobile number already exists in this tenant" };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  // 1. Create User identity record
  const user = await User.create({
    tenantId,
    email: email.toLowerCase(),
    phone,
    passwordHash,
    role: normalizedRole,
    status: "Active",
  });

  // 2. Generate employee code & create Staff employment record
  const employeeCode = staffData.employeeCode || (await generateEmployeeCode(tenantId));
  const staff = await Staff.create({
    tenantId,
    hostelId,
    userId: user._id,
    employeeCode,
    fullName,
    designation: designation || normalizedRole,
    joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
    salary: salary || 0,
    address: address || "",
    photo: photo || "",
    employmentStatus: "Active",
    createdBy,
  });

  // 3. Audit Log
  await AuditLog.create({
    hostelId,
    userId: createdBy,
    action: "Staff Created",
    actionType: "CREATE",
    entity: "Staff",
    targetId: staff._id,
    targetModel: "Staff",
    details: { fullName, role: normalizedRole, employeeCode, email },
  });

  // 4. Notification
  try {
    await publishNotification({
      userId: createdBy,
      hostelId,
      type: "staff_added",
      title: `New Staff Created: ${fullName}`,
      message: `${fullName} added as ${normalizedRole} (${employeeCode})`,
      meta: { route: "/staff", staffId: staff._id },
    });
  } catch (e) {
    logger.error("Notification publisher error:", e?.message || e);
  }

  const loginUrl = process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app/login";
  const whatsappMsg = generateStaffWhatsAppMessage(fullName, normalizedRole, email, password, loginUrl);
  const whatsappURL = generateWhatsAppURL(phone, whatsappMsg);

  return { staff, user, whatsappURL };
};

const getStaff = async (tenantId, filters = {}) => {
  const query = { tenantId, isDeleted: false };

  if (filters.hostelId) query.hostelId = filters.hostelId;
  if (filters.status) query.employmentStatus = filters.status;

  let staffList = await Staff.find(query)
    .populate({ path: "userId", select: "email phone role status lastLogin" })
    .sort({ createdAt: -1 });

  if (filters.role) {
    const normRole = normalizeRole(filters.role);
    staffList = staffList.filter((s) => s.userId?.role === normRole);
  }

  return staffList;
};

const getStaffById = async (tenantId, staffId) => {
  const staff = await Staff.findOne({ _id: staffId, tenantId, isDeleted: false }).populate({
    path: "userId",
    select: "email phone role status lastLogin",
  });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }
  return staff;
};

const getStaffProfile = async (userId) => {
  const user = await User.findById(userId).select("-passwordHash");
  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  const staff = await Staff.findOne({ userId: user._id, isDeleted: false }).populate("hostelId", "name address");
  return { user, staff };
};

const updateStaff = async (tenantId, staffId, updateData, updatedBy) => {
  const staff = await Staff.findOne({ _id: staffId, tenantId, isDeleted: false });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }

  const user = await User.findById(staff.userId);
  const oldValues = { staff: staff.toObject(), role: user?.role };

  // Handle User identity updates
  if (user) {
    if (updateData.email && updateData.email.toLowerCase() !== user.email) {
      const existingEmail = await User.findOne({
        tenantId,
        email: updateData.email.toLowerCase(),
        _id: { $ne: user._id },
      });
      if (existingEmail) {
        throw { statusCode: 409, message: "Email is already taken by another user" };
      }
      user.email = updateData.email.toLowerCase();
    }

    if (updateData.phone && updateData.phone !== user.phone) {
      const existingPhone = await User.findOne({ tenantId, phone: updateData.phone, _id: { $ne: user._id } });
      if (existingPhone) {
        throw { statusCode: 409, message: "Mobile number is already taken by another user" };
      }
      user.phone = updateData.phone;
    }

    if (updateData.role) {
      const newNormRole = normalizeRole(updateData.role);
      if (user.role !== newNormRole) {
        user.role = newNormRole;
        try {
          await publishNotification({
            userId: updatedBy,
            hostelId: staff.hostelId,
            type: "staff_updated",
            title: "Staff Role Changed",
            message: `${staff.fullName}'s role changed to ${newNormRole}`,
            meta: { route: "/staff" },
          });
        } catch (e) {
          logger.error("Role update notification error:", e?.message);
        }
      }
    }

    if (updateData.status) {
      user.status = updateData.status;
      staff.employmentStatus = updateData.status;
    }

    await user.save();
  }

  // Handle Staff employment updates
  if (updateData.fullName) staff.fullName = updateData.fullName;
  if (updateData.designation) staff.designation = updateData.designation;
  if (updateData.salary !== undefined) staff.salary = updateData.salary;
  if (updateData.joiningDate) staff.joiningDate = new Date(updateData.joiningDate);
  if (updateData.address !== undefined) staff.address = updateData.address;
  if (updateData.photo !== undefined) staff.photo = updateData.photo;
  if (updateData.hostelId) staff.hostelId = updateData.hostelId;

  staff.updatedBy = updatedBy;
  await staff.save();

  await AuditLog.create({
    hostelId: staff.hostelId,
    userId: updatedBy,
    action: "Staff Updated",
    actionType: "UPDATE",
    entity: "Staff",
    targetId: staff._id,
    targetModel: "Staff",
    oldValue: oldValues,
    newValue: { staff: staff.toObject(), role: user?.role },
  });

  return getStaffById(tenantId, staffId);
};

const toggleStatus = async (tenantId, staffId, status, updatedBy) => {
  const normStatus = status === "Active" || status === true ? "Active" : "Inactive";

  const staff = await Staff.findOne({ _id: staffId, tenantId, isDeleted: false });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }

  staff.employmentStatus = normStatus;
  staff.updatedBy = updatedBy;
  await staff.save();

  const user = await User.findById(staff.userId);
  if (user) {
    user.status = normStatus;
    await user.save();
  }

  await AuditLog.create({
    hostelId: staff.hostelId,
    userId: updatedBy,
    action: `Staff ${normStatus === "Active" ? "Activated" : "Disabled"}`,
    actionType: "UPDATE",
    entity: "Staff",
    targetId: staff._id,
    targetModel: "Staff",
    details: { status: normStatus, staffName: staff.fullName },
  });

  if (normStatus === "Inactive") {
    try {
      await publishNotification({
        userId: updatedBy,
        hostelId: staff.hostelId,
        type: "staff_disabled",
        title: "Staff Disabled",
        message: `Staff account ${staff.fullName} was disabled by Owner`,
        meta: { route: "/staff" },
      });
    } catch (e) {
      logger.error("Staff disabled notification error:", e?.message);
    }
  }

  return getStaffById(tenantId, staffId);
};

const resetPassword = async (tenantId, staffId, newPassword, resetBy) => {
  const staff = await Staff.findOne({ _id: staffId, tenantId, isDeleted: false });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }

  const user = await User.findById(staff.userId);
  if (!user) {
    throw { statusCode: 404, message: "Associated user identity record not found" };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await AuditLog.create({
    hostelId: staff.hostelId,
    userId: resetBy,
    action: "Password Reset",
    actionType: "UPDATE",
    entity: "Staff",
    targetId: staff._id,
    targetModel: "Staff",
    details: { staffName: staff.fullName, resetBy },
  });

  try {
    await publishNotification({
      userId: resetBy,
      hostelId: staff.hostelId,
      type: "password_reset",
      title: "Password Reset Completed",
      message: `Password reset successfully for ${staff.fullName}`,
      meta: { route: "/staff" },
    });
  } catch (e) {
    logger.error("Password reset notification error:", e?.message);
  }

  const loginUrl = process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app/login";
  const whatsappMsg = generateStaffWhatsAppMessage(staff.fullName, user.role, user.email, newPassword, loginUrl);
  const whatsappURL = generateWhatsAppURL(user.phone, whatsappMsg);

  return { staff, whatsappURL };
};

const changeSelfPassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw { statusCode: 404, message: "User not found" };
  }

  const matches = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!matches) {
    throw { statusCode: 400, message: "Current password does not match" };
  }

  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  await AuditLog.create({
    userId: user._id,
    action: "Self Password Changed",
    actionType: "UPDATE",
    entity: "User",
    targetId: user._id,
    targetModel: "User",
  });

  return { message: "Password updated successfully" };
};

const deleteStaff = async (tenantId, staffId, deletedBy) => {
  const staff = await Staff.findOne({ _id: staffId, tenantId, isDeleted: false });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }

  staff.isDeleted = true;
  staff.deletedAt = new Date();
  staff.employmentStatus = "Inactive";
  staff.updatedBy = deletedBy;
  await staff.save();

  const user = await User.findById(staff.userId);
  if (user) {
    user.status = "Inactive";
    await user.save();
  }

  await AuditLog.create({
    hostelId: staff.hostelId,
    userId: deletedBy,
    action: "Staff Deleted",
    actionType: "DELETE",
    entity: "Staff",
    targetId: staff._id,
    targetModel: "Staff",
    details: { staffName: staff.fullName, employeeCode: staff.employeeCode },
  });

  try {
    await publishNotification({
      userId: deletedBy,
      hostelId: staff.hostelId,
      type: "staff_removed",
      title: "Staff Deleted",
      message: `Staff member ${staff.fullName} was deleted`,
      meta: { route: "/staff" },
    });
  } catch (e) {
    logger.error("Staff deleted notification error:", e?.message);
  }

  return { message: "Staff deleted successfully" };
};

const getStaffActivity = async (tenantId, staffId) => {
  const staff = await Staff.findOne({ _id: staffId, tenantId });
  if (!staff) {
    throw { statusCode: 404, message: "Staff member not found" };
  }

  const logs = await AuditLog.find({
    $or: [{ targetId: staff._id }, { userId: staff.userId }],
  })
    .sort({ timestamp: -1 })
    .limit(50);

  return logs;
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
};
