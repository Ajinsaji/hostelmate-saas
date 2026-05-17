const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Owner = require("../models/Owner");
const Staff = require("../models/Staff");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const Room = require("../models/Room");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const PublicAdmission = require("../models/PublicAdmission");

// ==========================
// OWNER/STAFF LOGIN
// Supports owner, warden, cook
// Issues JWT payload: { userId, hostelId, role }
// ==========================
const loginOwner = async (req, res) => {
  try {
    const { email, phone, password, username } = req.body || {};

    const looksLikeBcryptHash = (val) => typeof val === "string" && /^\$2[aby]\$\d{2}\$/.test(val);

    const safePasswordCompare = async (plain, stored) => {
      if (!stored) return false;
      if (looksLikeBcryptHash(stored)) return bcrypt.compare(plain, stored);
      return plain === stored;
    };





    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required",
      });
    }

    if (!email && !phone && !username) {
      return res.status(400).json({
        success: false,
        message: "Provide email, phone or username",
      });
    }

    let owner = null;
    let staff = null;
    let userRole = "owner";
    let userId = null;
    let hostelId = null;
    let userResponse = null;

    if (username) {
      staff = await Staff.findOne({ username, isActive: true });
    }

    if (!staff && (phone || email)) {
      const query = {
        status: { $ne: "disabled" },
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
      };

      const ownerCandidate = await Owner.findOne(query);

      if (ownerCandidate) {
        const ok = await safePasswordCompare(password, ownerCandidate.password);
        if (ok) owner = ownerCandidate;
      }

      if (!owner) {
        staff = await Staff.findOne({
          ...(phone ? { phone } : {}),
          ...(email ? { email } : {}),
          isActive: true,
        });
      }
    }

    if (staff) {
      const isValid = await bcrypt.compare(password, staff.passwordHash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: "Invalid credentials" });
      }

      userRole = staff.role;
      userId = staff._id;
      hostelId = staff.hostelId;
      userResponse = {
        _id: staff._id,
        fullName: staff.fullName,
        phone: staff.phone,
        username: staff.username,
        role: staff.role,
        isActive: staff.isActive,
        hostelId: staff.hostelId,
      };
    }

    if (!staff && owner) {
      // Ensure hostel exists
      const hostel = await Hostel.findById(owner.hostelId);
      if (!hostel) {
        return res.status(400).json({
          success: false,
          message: "Hostel not found for this owner",
        });
      }

      userRole = "owner";
      userId = owner._id;
      hostelId = hostel._id;
      userResponse = {
        _id: owner._id,
        ownerName: owner.ownerName,
        phone: owner.phone,
        email: owner.email,
        status: owner.status,
        hostelId: hostel._id,
        username: owner.username,
        profileImage: owner.profileImage || "",
      };
    }

    if (!staff && !owner) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const payload = {
      userId,
      hostelId,
      role: userRole,
    };

    const secret = process.env.JWT_SECRET || "change_me_secret";
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    if (owner) {
      const subscription = await Subscription.findOne({ hostelId: hostelId });
      return res.status(200).json({
        success: true,
        message: "Login Success",
        token,
        owner: userResponse,
        subscription,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login Success",
      token,
      user: userResponse,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,

      message: "Internal Server Error",
      details: error?.message,
    });
  }
};

// ==========================
// SUPERADMIN: RESET OWNER PASSWORD
// ==========================
const resetOwnerPassword = async (req, res) => {
  try {
    const { ownerId, phone, email, newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ success: false, message: "newPassword is required" });
    }

    const query = {
      status: { $ne: "disabled" },
      ...(ownerId ? { _id: ownerId } : {}),
      ...(phone ? { phone } : {}),
      ...(email ? { email } : {}),
    };

    const updated = await Owner.findOneAndUpdate(
      query,
      { password: newPassword },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    res.status(200).json({
      success: true,
      message: "Password reset successfully",
      owner: updated,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};


// ==========================
// SUPERADMIN: DISABLE/SUSPEND OWNER
// ==========================
const setOwnerStatus = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const { status } = req.body;

    if (!["active", "disabled", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const updated = await Owner.findByIdAndUpdate(
      ownerId,
      { status },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    res.status(200).json({ success: true, owner: updated });
  } catch (error) {
    res.status(500).json(error);
  }
};

// ==========================
// SUPERADMIN: FORCE LOGOUT (PLACEHOLDER)
// ==========================
// Your current system does not use JWT/session. So this is a placeholder.
const forceLogout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Force logout not implemented (no token/session in current project).",
  });
};

// ==========================
// SUPERADMIN: TRANSFER OWNERSHIP (PLACEHOLDER)
// ==========================
const transferOwnership = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Transfer ownership not implemented yet.",
  });
};

// ==========================
// OWNER DASHBOARD STATS
// ==========================
const getDashboardStats = async (req, res) => {
  try {
    const { hostelId } = req.owner;
    
    const rooms = await Room.find({ hostelId });
    const residentsCount = await Resident.countDocuments({ hostelId, status: "active" });
    
    let totalBeds = 0;
    rooms.forEach(room => { totalBeds += room.totalBeds; });
    
    const pendingPayments = await Payment.find({ hostelId, status: { $in: ["pending", "partial"] } });
    let pendingRent = 0;
    pendingPayments.forEach(p => { pendingRent += (p.balance || 0); });
    
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const payments = await Payment.find({ hostelId });
    let todayCollection = 0;
    payments.forEach(p => {
      p.entries.forEach(entry => {
        if (entry.createdAt >= startOfDay && entry.createdAt <= endOfDay) {
          todayCollection += entry.amount;
        }
      });
    });

    const hostel = await Hostel.findById(hostelId);
    const owner = await Owner.findById(ownerId);

    res.status(200).json({
      success: true,
      stats: {
        residents: residentsCount,
        rooms: rooms.length,
        totalBeds,
        occupancyRate: totalBeds > 0 ? Math.round((residentsCount / totalBeds) * 100) : 0,
        pendingRent,
        todayCollection,
      },
      hostel,
      owner: owner
        ? {
            _id: owner._id,
            ownerName: owner.ownerName,
            phone: owner.phone,
            email: owner.email,
            username: owner.username,
            profileImage: owner.profileImage || "",
            status: owner.status,
            hostelId: owner.hostelId,
          }
        : null,
    });

  } catch (error) {
    res.status(500).json(error);
  }
};

// ==========================
// OWNER: GET PENDING ADMISSION COUNT
// ==========================
const getPendingCount = async (req, res) => {
  try {
    const { hostelId } = req.owner;
    
    const pendingAdmissions = await Resident.countDocuments({
      hostelId,
      status: "pending"
    });

    res.status(200).json({
      success: true,
      pendingAdmissions: pendingAdmissions || 0
    });
  } catch (error) {
    res.status(500).json({

      success: false,
      error: error.message
    });
  }
};

// ==========================
// OWNER: GET PUBLIC ADMISSIONS
// ==========================
const getAdmissions = async (req, res) => {
  try {
    const { hostelId } = req.owner;
    const admissions = await PublicAdmission.find({ hostelId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, admissions });
  } catch (error) {
    res.status(500).json(error);
  }
};

// ==========================
// OWNER: APPROVE ADMISSION
// ==========================
const approveAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostelId } = req.owner;
    
    const admission = await PublicAdmission.findOne({ _id: id, hostelId });
    if (!admission) return res.status(404).json({ success: false, message: "Not found" });

    // Validate room preference (frontend should send a roomId or bed/room selection)
    const roomId = admission.roomPreference;
    if (!roomId) {
      return res.status(400).json({ success: false, message: "Missing room preference" });
    }

    // Create resident (bed assignment/occupancy is handled by Bed model rules)
    const resident = await Resident.create({
      hostelId,
      name: admission.residentName,
      phone: admission.phone,
      email: admission.email,
      emergencyContact: admission.emergencyContact,
      address: admission.address,
      roomId,
      status: "active",
      aadhaarPhoto: admission.idProofFile,
      userPhoto: admission.photoFile,

      // Immutable consent snapshot copied from PublicAdmission at approval time
      rulesVersionId: admission.rulesVersionId,
      rulesVersionNumber: admission.rulesVersionNumber,
      acceptedRulesTextSnapshot: admission.acceptedRulesTextSnapshot,
      signatureImage: admission.signatureImage,
      signedAt: admission.signedAt,
      agreementChecked: admission.agreementChecked,
    });

    admission.status = "Approved";
    await admission.save();

    // Notification for this approval
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      await publishNotification({
        userId: req.owner?.ownerId,
        hostelId,
        type: "resident_approved",
        message: "Resident approved",
        meta: {
          route: "/admissions",
          residentId: resident?._id || null,
          admissionId: admission?._id || null,
        },
      });
    } catch (e) {
      console.error("Resident approval notification failed:", e?.message || e);
    }

    // NOTE: This system previously used Bed allocation when manually creating residents.

    // Public admissions need bed allocation too; keep minimal correctness for now.

    res.status(200).json({ success: true, message: "Admission approved & Resident created", resident });
  } catch (error) {
    res.status(500).json(error);
  }
};


// ==========================
// OWNER: REJECT ADMISSION
// ==========================
const rejectAdmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { hostelId } = req.owner;
    
    const admission = await PublicAdmission.findOne({ _id: id, hostelId });
    if (!admission) return res.status(404).json({ success: false, message: "Not found" });

    admission.status = "Rejected";
    await admission.save();

    // Notification for rejection
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      await publishNotification({
        userId: req.owner?.ownerId,
        hostelId,
        type: "resident_rejected",
        message: "Resident rejected",
        meta: {
          route: "/admissions",
          admissionId: admission?._id || null,
        },
      });
    } catch (e) {
      console.error("Resident rejection notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Admission rejected" });

  } catch (error) {
    res.status(500).json(error);
  }
};

const updateHostelSettings = async (req, res) => {
  try {
    const { hostelId } = req.owner;
    const {
      hostelName,
      address,
      district,
      pincode,
      phone,
      whatsapp,
      amenities,
      rulesText,
      rules,
      description,
      rulesConfig,
      currentRulesVersion,
      rulesVersionNumber,
    } = req.body || {};

    if (!hostelId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Get current hostel to check rules change
    const currentHostel = await Hostel.findById(hostelId);
    const rulesChanged = (rulesText || rules) && (rulesText || rules) !== (currentHostel?.rulesText || "");

    const updates = {
      hostelName,
      address,
      district,
      pincode,
      phone,
      whatsapp,
      description,
    };

    // Handle amenities - convert string to array if needed
    if (amenities) {
      if (typeof amenities === "string") {
        updates.amenities = amenities.split(",").map((a) => a.trim()).filter((a) => a);
      } else if (Array.isArray(amenities)) {
        updates.amenities = amenities;
      }
    }

    // Handle rules and versioning
    if (rulesText || rules) {
      const ruleContent = rulesText || rules;
      updates.rulesText = ruleContent;

      // Create new version if rules changed
      if (rulesChanged) {
        const newVersionNumber = rulesVersionNumber || (currentHostel?.rulesVersionNumber || 0) + 1;
        const newVersionId = `v${newVersionNumber}-${Date.now()}`;

        updates.currentRulesVersion = newVersionId;
        updates.rulesVersionNumber = newVersionNumber;

        // Add to history
        const historyEntry = {
          versionId: newVersionId,
          versionNumber: newVersionNumber,
          rulesText: ruleContent,
          createdAt: new Date(),
        };

        const currentHistory = currentHostel?.rulesVersionHistory || [];
        updates.rulesVersionHistory = [...currentHistory, historyEntry];
      }
    }

    // Handle rules configuration
    if (rulesConfig) {
      updates.rulesConfig = {
        requireAadhaar: rulesConfig.requireAadhaar ?? false,
        requireSignature: rulesConfig.requireSignature ?? true,
        signatureOptions: rulesConfig.signatureOptions || ["digital"],
        consentText: rulesConfig.consentText,
        enableAadhaar: rulesConfig.enableAadhaar ?? false,
        enableSignature: rulesConfig.enableSignature ?? true,
      };
    }

    // Keep only defined keys
    Object.keys(updates).forEach((k) => updates[k] === undefined && delete updates[k]);

    const updated = await Hostel.findByIdAndUpdate(hostelId, updates, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    res.status(200).json({
      success: true,
      message: "Hostel settings saved successfully",
      hostel: updated,
    });
  } catch (e) {
    console.error("updateHostelSettings error:", e);
    return res.status(500).json({
      success: false,
      message: "Failed to update hostel settings",
      error: e.message,
    });
  }
};

const updateOwnerProfile = async (req, res) => {
  try {
    const { ownerId } = req.owner;
    const { ownerName, phone, email } = req.body || {};

    if (!ownerId) return res.status(401).json({ success: false, message: "Unauthorized", data: null });

    if (!ownerName?.toString().trim()) return res.status(400).json({ success: false, message: "ownerName is required", data: null });
    if (!phone?.toString().trim()) return res.status(400).json({ success: false, message: "phone is required", data: null });
    if (!email?.toString().trim()) return res.status(400).json({ success: false, message: "email is required", data: null });

    const updates = {
      ownerName,
      phone,
      email,
      updatedAt: new Date(),
    };

    const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
    if (req.files?.profileImage?.[0]) {
      if (process.env.NODE_ENV !== "production") {
        console.log("profileImage upload:", req.files.profileImage[0]?.path, req.files.profileImage[0]?.secure_url);
      }
      updates.profileImage =
        req.files.profileImage[0]?.secure_url ||
        getUploadedFileUrl(req.files.profileImage[0]) ||
        req.files.profileImage[0].filename;
    }

    const updated = await Owner.findByIdAndUpdate(ownerId, updates, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Owner not found", data: null });

    return res.status(200).json({ success: true, message: "Profile updated", data: { owner: updated } });
  } catch (e) {
    console.error("updateOwnerProfile error:", e);
    return res.status(500).json({ success: false, message: "Failed to update profile", data: null });
  }
};

const updateOwnerPassword = async (req, res) => {
  try {
    const { ownerId } = req.owner;

    const looksLikeBcryptHash = (val) => typeof val === "string" && /^\$2[aby]\$\d{2}\$/.test(val);

    // bcrypt hash => bcrypt.compare
    // else => plaintext fallback (legacy records)
    const safePasswordCompare = async (plain, stored) => {
      if (!stored) return false;
      if (looksLikeBcryptHash(stored)) return bcrypt.compare(plain, stored);
      return plain === stored;
    };

    const { currentPassword, newPassword, confirmPassword } = req.body || {};



    if (!ownerId) return res.status(401).json({ success: false, message: "Unauthorized", data: null });

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, message: "All fields are required", data: null });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters", data: null });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Confirm password does not match", data: null });
    }

    const owner = await Owner.findById(ownerId);
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found", data: null });

    const ok = await safePasswordCompare(currentPassword, owner.password);
    if (!ok) return res.status(400).json({ success: false, message: "Current password is incorrect", data: null });

    const salt = await bcrypt.genSalt(10);
    owner.password = await bcrypt.hash(newPassword, salt);
    owner.updatedAt = new Date();
    await owner.save();

    return res.status(200).json({ success: true, message: "Password updated", data: null });
  } catch (e) {
    console.error("updateOwnerPassword error:", e);
    return res.status(500).json({ success: false, message: "Failed to update password", data: null });
  }
};

module.exports = {
  loginOwner,
  resetOwnerPassword,
  setOwnerStatus,
  forceLogout,
  transferOwnership,
  getDashboardStats,
  getPendingCount,
  getAdmissions,
  approveAdmission,
  rejectAdmission,
  updateHostelSettings,
  updateOwnerProfile,
  updateOwnerPassword,
};





