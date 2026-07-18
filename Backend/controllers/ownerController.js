const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Owner = require("../models/Owner");
const Staff = require("../models/Staff");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
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
    console.log("LOGIN ATTEMPT");
    console.log("Username entered:", username, "Email entered:", email, "Phone entered:", phone);


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
      console.log("Owner found:", ownerCandidate?.username, "Phone:", ownerCandidate?.phone);
      console.log("Stored hash exists:", !!ownerCandidate?.password);
      console.log("Owner candidate debug:", {
        _id: ownerCandidate?._id,
        phone: ownerCandidate?.phone,
        email: ownerCandidate?.email,
        onboardingCompleted: !!ownerCandidate?.onboardingCompleted,
      });

      if (ownerCandidate) {
        const ok = await safePasswordCompare(password, ownerCandidate.password);
        console.log("Password match:", ok);
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

      if (hostel?.pendingActivation) {
        return res.status(403).json({
          success: false,
          message: "Hostel activation pending. Contact administrator.",
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

    const needsOnboarding = !!owner.firstLogin || !owner.onboardingCompleted;

    const payload = {
      userId,
      hostelId,
      role: userRole,
      mustChangePassword: !!owner?.mustChangePassword,
      onboardingCompleted: !!owner?.onboardingCompleted,
      onboardingStep: owner?.onboardingStep || 1,
    };

    console.log("===== LOGIN RESPONSE =====");
    console.log("Owner onboardingStep:", owner?.onboardingStep);
    console.log("Owner onboardingCompleted:", owner?.onboardingCompleted);
    console.log("Owner firstLogin:", owner?.firstLogin);
    console.log("Owner rulesConfigured:", owner?.rulesConfigured);
    console.log("Owner roomsConfigured:", owner?.roomsConfigured);


    const secret = process.env.JWT_SECRET || "change_me_secret";
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    if (owner) {
      const subscription = await Subscription.findOne({ hostelId: hostelId });
      return res.status(200).json({
        success: true,
        message: "Login Success",
        token,
        needsOnboarding,
        owner: {
          ...userResponse,
          firstLogin: !!owner.firstLogin,
          passwordChanged: !!owner.passwordChanged,
          rulesConfigured: !!owner.rulesConfigured,
          roomsConfigured: !!owner.roomsConfigured,
          onboardingCompleted: !!owner.onboardingCompleted,
          mustChangePassword: !!owner.mustChangePassword,
          onboardingStep: owner?.onboardingStep || 1,
        },
        subscription,
        mustChangePassword: !!owner.mustChangePassword,
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
    const { hostelId, ownerId } = req.owner;
    const mongoose = require("mongoose");
    const hId = new mongoose.Types.ObjectId(hostelId);

    const [
      residentsAgg,
      roomsAgg,
      paymentsAgg,
      hostel,
      owner
    ] = await Promise.all([
      Resident.aggregate([
        { $match: { hostelId: hId, status: "active" } },
        { $count: "count" }
      ]),
      Room.aggregate([
        { $match: { hostelId: hId } },
        { $group: {
            _id: null,
            totalRooms: { $sum: 1 },
            totalBeds: { $sum: "$totalBeds" },
            occupiedBeds: { $sum: "$occupiedBeds" }
          }
        }
      ]),
      Payment.aggregate([
        { $match: { hostelId: hId } },
        { $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $in: ["$status", ["completed", "success"]] }, "$paidAmount", 0]
              }
            },
            pendingRent: {
              $sum: {
                $cond: [{ $in: ["$status", ["pending", "partial"]] }, "$balance", 0]
              }
            }
          }
        }
      ]),
      Hostel.findById(hostelId),
      Owner.findById(ownerId)
    ]);

    // Calculate today's collection separately as array elements can be complex to match in top-level group
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    const todayAgg = await Payment.aggregate([
      { $match: { hostelId: hId } },
      { $unwind: "$entries" },
      { $match: { "entries.createdAt": { $gte: startOfDay, $lte: endOfDay } } },
      { $group: { _id: null, todayCollection: { $sum: "$entries.amount" } } }
    ]);

    const residentsCount = residentsAgg[0]?.count || 0;
    const roomStats = roomsAgg[0] || { totalRooms: 0, totalBeds: 0, occupiedBeds: 0 };
    const paymentStats = paymentsAgg[0] || { totalRevenue: 0, pendingRent: 0 };
    const todayCollection = todayAgg[0]?.todayCollection || 0;

    const totalBeds = roomStats.totalBeds || 0;
    const occupiedBeds = roomStats.occupiedBeds || 0;
    const vacantBeds = totalBeds > 0 ? totalBeds - occupiedBeds : 0;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;
    const vacancyRate = totalBeds > 0 ? 100 - occupancyRate : 0;

    const expenses = 0; // Returning 0 as Expense data model is empty

    res.status(200).json({
      success: true,
      stats: {
        residents: residentsCount,
        rooms: roomStats.totalRooms,
        totalBeds,
        occupiedBeds,
        vacancy: vacantBeds,
        occupancyRate,
        vacancyRate,
        pendingRent: paymentStats.pendingRent,
        todayCollection,
        revenue: paymentStats.totalRevenue,
        expenses
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
    res.status(500).json({ success: false, error: error.message });
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

    // Assign a Bed in the preferred room
    const bed = await Bed.findOne({ roomId, status: "vacant" });
    if (!bed) {
      return res.status(400).json({ success: false, message: "No vacant beds available in the preferred room" });
    }

    // Generate a Resident ID (using MongoDB ObjectId, as no custom field exists in Schema)
    // Or we can just let mongoose create the _id.
    const room = await Room.findById(roomId);
    if (!room || room.occupiedBeds >= room.totalBeds) {
      return res.status(400).json({ success: false, message: "Room is already full" });
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
      bedId: bed._id,
      monthlyRent: room.rentPerBed || 0,
      depositAmount: 0,
      joinDate: new Date(),
      status: "active",
      idProof: admission.idProofFile,
      photo: admission.photoFile,

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

    // Update Bed
    bed.status = "occupied";
    bed.residentId = resident._id;
    await bed.save();

    // Update Room
    await Room.findByIdAndUpdate(roomId, {
      $inc: { occupiedBeds: 1 }
    });

    // Notification for this approval
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      await publishNotification({
        userId: req.owner?.ownerId,
        hostelId,
        type: "resident_approved",
        title: "Resident Approved",
        message: `Resident ${resident.name} approved and assigned to room ${room.roomNumber}`,
        meta: {
          route: "/admissions",
          residentId: resident?._id || null,
          admissionId: admission?._id || null,
        },
      });
    } catch (e) {
      console.error("Resident approval notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Admission approved & Resident created", resident });
  } catch (error) {
    console.log(error);
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

    console.log("Saved hostel rules:", updated.rulesText);

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

    // Support two modes:
    // 1. With currentPassword - regular password update (requires old password verification)
    // 2. Without currentPassword - onboarding password change (no verification needed)
    const isOnboarding = !currentPassword;

    if (!newPassword || !confirmPassword) {
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

    // If not onboarding, verify current password
    if (!isOnboarding) {
      const ok = await safePasswordCompare(currentPassword, owner.password);
      if (!ok) return res.status(400).json({ success: false, message: "Current password is incorrect", data: null });
    }

    const salt = await bcrypt.genSalt(10);
    owner.password = await bcrypt.hash(newPassword, salt);

    // Clear temp-password lifecycle and end forced-password change
    owner.mustChangePassword = false;
    owner.tempPassword = null;
    owner.firstLogin = false;
      owner.passwordChanged = true;
    
      // Persist next onboarding screen after password step
      owner.onboardingStep = 3;


    owner.updatedAt = new Date();
    await owner.save();

    console.log("OWNER AFTER PASSWORD:", owner.onboardingStep);

    return res.status(200).json({ success: true, message: "Password updated", data: {

      firstLogin: owner.firstLogin,
      passwordChanged: owner.passwordChanged,
      mustChangePassword: owner.mustChangePassword,
      onboardingCompleted: owner.onboardingCompleted,
    } });
  } catch (e) {
    console.error("updateOwnerPassword error:", e);
    return res.status(500).json({ success: false, message: "Failed to update password", data: null });
  }
};

const saveOnboardingRules = async (req, res) => {
  try {
    const { hostelId, ownerId } = req.owner;
    const { rules, rulesText, rulesConfig } = req.body || {};

    if (!hostelId || !ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    // Accept either 'rules' (from new frontend) or 'rulesText' (legacy)
    const finalRulesText = rules || rulesText || "";

    if (!String(finalRulesText).trim()) {
      return res.status(400).json({ success: false, message: "Rules text is required", data: null });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found", data: null });
    }

    const updatedData = {
      rulesText: finalRulesText.trim(),
    };

    const hasRulesChanged = String(finalRulesText || "").trim() !== String(hostel.rulesText || "").trim();
    if (hasRulesChanged) {
      const newVersionNumber = (hostel.rulesVersionNumber || 0) + 1;
      const newVersionId = `v${newVersionNumber}-${Date.now()}`;
      updatedData.currentRulesVersion = newVersionId;
      updatedData.rulesVersionNumber = newVersionNumber;
      updatedData.rulesVersionHistory = [
        ...(hostel.rulesVersionHistory || []),
        {
          versionId: newVersionId,
          versionNumber: newVersionNumber,
          rulesText: finalRulesText.trim(),
          createdAt: new Date(),
        },
      ];
    }

    if (rulesConfig && typeof rulesConfig === "object") {
      updatedData.rulesConfig = {
        ...hostel.rulesConfig,
        ...rulesConfig,
      };
    }

    const [updatedHostel, updatedOwner] = await Promise.all([
      Hostel.findByIdAndUpdate(hostelId, updatedData, { new: true, runValidators: true }),
      Owner.findByIdAndUpdate(
        ownerId,
        { rulesConfigured: true, onboardingStep: 4 },
        { new: true }
      ),
    ]);

    console.log("OWNER AFTER RULES:", updatedOwner?.onboardingStep);

    return res.status(200).json({

      success: true,
      message: "Hostel rules saved successfully",
      hostel: updatedHostel,
      owner: {
        rulesConfigured: !!updatedOwner.rulesConfigured,
        onboardingCompleted: !!updatedOwner.onboardingCompleted,
      },
    });
  } catch (e) {
    console.error("saveOnboardingRules error:", e);
    return res.status(500).json({ success: false, message: "Failed to save rules", data: null });
  }
};

const completeOnboardingRooms = async (req, res) => {
  try {
    const { hostelId, ownerId } = req.owner;
    const { roomNumber, roomType, totalBeds, rentPerBed, skip, rooms } = req.body || {};

    if (!hostelId || !ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    let createdRooms = [];

    // Support both old format (single room) and new format (array of rooms)
    const roomsList = Array.isArray(rooms) ? rooms : [];
    const hasSingleRoom = !skip && String(roomNumber || "").trim() && Number(totalBeds) > 0;

    if (hasSingleRoom && roomsList.length === 0) {
      // Legacy: single room format
      const normalizedRoomNumber = String(roomNumber).trim();
      const existingRoom = await Room.findOne({ hostelId, roomNumber: { $regex: `^${normalizedRoomNumber}$`, $options: "i" } });
      if (existingRoom) {
        return res.status(400).json({ success: false, message: "Room number already exists", data: null });
      }

      const room = await Room.create({
        hostelId,
        roomNumber: normalizedRoomNumber,
        roomType: roomType || "Standard",
        totalBeds: Number(totalBeds),
        rentPerBed: Number(rentPerBed) || 0,
      });

      const beds = [];
      for (let i = 1; i <= Number(totalBeds); i += 1) {
        beds.push({
          hostelId,
          roomId: room._id,
          bedNumber: `B${i}`,
          status: "vacant",
        });
      }
      await Bed.insertMany(beds);
      createdRooms.push(room);
    } else if (roomsList.length > 0) {
      // New: array of rooms format
      for (const roomData of roomsList) {
        const normalizedRoomNumber = String(roomData.name || `Room-${Date.now()}`).trim();
        const bedCount = Math.max(1, Number(roomData.beds) || 1);

        const room = await Room.create({
          hostelId,
          roomNumber: normalizedRoomNumber,
          roomType: "Standard",
          totalBeds: bedCount,
          rentPerBed: 0,
        });

        const beds = [];
        for (let i = 1; i <= bedCount; i += 1) {
          beds.push({
            hostelId,
            roomId: room._id,
            bedNumber: `B${i}`,
            status: "vacant",
          });
        }
        await Bed.insertMany(beds);
        createdRooms.push(room);
      }
    }

    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      {
        roomsConfigured: true,
        onboardingCompleted: true,
        firstLogin: false,
        onboardingStep: 5,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      rooms: createdRooms,
      owner: {
        roomsConfigured: !!updatedOwner.roomsConfigured,
        onboardingCompleted: !!updatedOwner.onboardingCompleted,
      },
    });
  } catch (e) {
    console.error("completeOnboardingRooms error:", e);
    return res.status(500).json({ success: false, message: "Failed to complete onboarding", data: null });
  }
};

// ==========================
// Complete Onboarding
// ==========================
const completeOnboarding = async (req, res) => {
  try {
    const { ownerId } = req.owner;

    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const updatedOwner = await Owner.findByIdAndUpdate(
      ownerId,
      {
        onboardingCompleted: true,
        firstLogin: false,
        mustChangePassword: false,
        onboardingStep: 5,
      },
      { new: true }
    );

    if (!updatedOwner) {
      return res.status(404).json({ success: false, message: "Owner not found", data: null });
    }

    return res.status(200).json({
      success: true,
      message: "Onboarding completed",
      owner: {
        onboardingCompleted: !!updatedOwner.onboardingCompleted,
        firstLogin: !!updatedOwner.firstLogin,
      },
    });
  } catch (e) {
    console.error("completeOnboarding error:", e);
    return res.status(500).json({ success: false, message: "Failed to complete onboarding", data: null });
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
  saveOnboardingRules,
  completeOnboardingRooms,
  completeOnboarding,
};





