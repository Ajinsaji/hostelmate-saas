const crypto = require("crypto");
const { logger } = require("../utils/logger");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Owner = require("../models/Owner");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const OwnerSession = require("../models/OwnerSession");
const { parseUserAgent } = require("./ownerSessionController");
const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const PublicAdmission = require("../models/PublicAdmission");

// Utility: detect bcrypt hash format ($2a$, $2b$, $2y$ prefix, 60 chars)
const looksLikeBcryptHash = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str);
};

// ==========================
// OWNER/STAFF LOGIN
// Supports owner, warden, cook
// Issues JWT payload: { userId, hostelId, role }
// ==========================
const loginOwner = async (req, res) => {
  try {
    let { email, phone, password, username, identifier } = req.body || {};
    logger.info("LOGIN ATTEMPT");
    logger.info("Username entered:", username, "Email entered:", email, "Phone entered:", phone, "Identifier entered:", identifier);

    if (identifier && !email && !phone && !username) {
      const cleanId = String(identifier).trim();
      if (cleanId.includes("@")) {
        email = cleanId;
      } else if (/^\+?\d{7,15}$/.test(cleanId.replace(/\s+/g, ""))) {
        phone = cleanId;
      } else {
        username = cleanId;
      }
    }

    const safePasswordCompare = async (plain, stored) => {
      if (!stored) return false;
      if (looksLikeBcryptHash(stored)) {
        return bcrypt.compare(plain, stored);
      }
      logger.info("SECURITY WARNING: Non-bcrypt password blocked.");
      return false; // Strict bcrypt only, no plaintext fallback
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
    let authUser = null;
    let userRole = "owner";
    let userId = null;
    let hostelId = null;
    let userResponse = null;

    // 1. Try unified User authentication first
    const userQuery = {
      status: "Active",
      ...(email ? { email: email.toLowerCase() } : {}),
      ...(phone ? { phone } : {}),
    };

    if (email || phone) {
      const candidateUser = await User.findOne(userQuery);
      if (candidateUser) {
        const ok = await bcrypt.compare(password, candidateUser.passwordHash);
        if (ok) {
          authUser = candidateUser;
          authUser.lastLogin = new Date();
          await authUser.save();
        }
      }
    }

    if (authUser) {
      userRole = authUser.role;
      userId = authUser._id;
      hostelId = authUser.tenantId;

      const staffRecord = await Staff.findOne({ userId: authUser._id, isDeleted: false });
      if (staffRecord) {
        hostelId = staffRecord.hostelId || authUser.tenantId;
      }

      userResponse = {
        _id: authUser._id,
        fullName: staffRecord ? staffRecord.fullName : authUser.email,
        email: authUser.email,
        phone: authUser.phone,
        role: authUser.role,
        status: authUser.status,
        hostelId,
        employeeCode: staffRecord?.employeeCode || "",
      };
    }

    // 2. Legacy fallback checks if User record wasn't found
    if (!authUser) {
      if (username) {
        staff = await Staff.findOne({ username, isActive: true, isDeleted: false });
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
            isDeleted: false,
          });
        }
      }

      if (staff) {
        const isValid = await bcrypt.compare(password, staff.passwordHash);
        if (!isValid) {
          return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        if (staff.hostelId) {
          const staffHostel = await Hostel.findById(staff.hostelId);
          if (staffHostel?.isDeleted) {
            return res.status(403).json({
              success: false,
              message: "Hostel account is currently retained in Trash. Please contact administrator.",
            });
          }
        }

        userRole = staff.role;
        userId = staff._id;
        hostelId = staff.hostelId;
        userResponse = {
          _id: staff._id,
          fullName: staff.fullName,
          phone: staff.phone,
          username: staff.username || staff.fullName,
          role: staff.role,
          isActive: staff.isActive,
          hostelId: staff.hostelId,
        };
      }
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

      if (hostel?.isDeleted) {
        return res.status(403).json({
          success: false,
          message: "Hostel account is currently retained in Trash. Please contact administrator.",
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
        hostelName: hostel.hostelName || hostel.name || "",
        username: owner.username,
        profileImage: owner.profileImage || "",
      };
    }

    if (!authUser && !staff && !owner) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const needsOnboarding = owner ? (!!owner.firstLogin || !owner.onboardingCompleted) : false;

    const sessionId = crypto.randomUUID();
    const deviceId = req.body?.deviceId || req.headers?.["x-device-id"] || crypto.randomUUID();
    const userAgentStr = req.headers?.["user-agent"] || "";
    const uaInfo = parseUserAgent(userAgentStr);

    const deviceName = req.body?.deviceName || `${uaInfo.operatingSystem} • ${uaInfo.browser}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    if (owner || authUser || staff) {
      try {
        await OwnerSession.create({
          ownerId: userId,
          hostelId: hostelId || null,
          sessionId,
          deviceId,
          deviceName,
          deviceType: uaInfo.deviceType,
          browser: uaInfo.browser,
          operatingSystem: uaInfo.operatingSystem,
          ipAddress: req.ip || req.headers?.["x-forwarded-for"] || "",
          userAgent: userAgentStr,
          expiresAt,
          isRevoked: false,
        });
      } catch (sessErr) {
        logger.error("Error creating owner session record:", sessErr);
      }
    }

    const payload = {
      userId,
      hostelId,
      role: userRole,
      sessionId,
      mustChangePassword: !!owner?.mustChangePassword,
      onboardingCompleted: !!owner?.onboardingCompleted,
      onboardingStep: owner?.onboardingStep || 1,
    };

    logger.info("===== LOGIN RESPONSE =====");
    logger.info("Owner onboardingStep:", owner?.onboardingStep);
    logger.info("Owner onboardingCompleted:", owner?.onboardingCompleted);
    logger.info("Owner firstLogin:", owner?.firstLogin);
    logger.info("Owner rulesConfigured:", owner?.rulesConfigured);
    logger.info("Owner roomsConfigured:", owner?.roomsConfigured);

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Server misconfigured: JWT_SECRET missing" });
    }
    const token = jwt.sign(payload, secret, { expiresIn: "7d" });

    if (owner) {
      const [subscription, hostelDoc] = await Promise.all([
        Subscription.findOne({ hostelId: hostelId }),
        Hostel.findById(hostelId),
      ]);
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
        hostel: hostelDoc
          ? {
              _id: hostelDoc._id,
              id: hostelDoc._id,
              name: hostelDoc.hostelName || hostelDoc.name || "",
              hostelName: hostelDoc.hostelName || hostelDoc.name || "",
              address: hostelDoc.address || "",
              phone: hostelDoc.phone || "",
              qrCodeUrl: hostelDoc.qrCodeUrl || "",
              planType: hostelDoc.planType || "Unified",
            }
          : null,
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

    const owner = await Owner.findOne(query);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    // Hash before storing — findOneAndUpdate bypasses the pre-save hook
    const salt = await bcrypt.genSalt(10);
    owner.password = await bcrypt.hash(newPassword, salt);
    owner.mustChangePassword = false;
    const updated = await owner.save();

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
      { returnDocument: "after" }
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

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const [
      residentsAgg,
      roomsAgg,
      paymentsAgg,
      hostel,
      owner,
      pendingAdmissionsCount,
      newAdmissionsTodayCount,
      todayAgg
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
      Owner.findById(ownerId),
      PublicAdmission.countDocuments({ hostelId: hId, status: "Pending" }),
      PublicAdmission.countDocuments({ hostelId: hId, createdAt: { $gte: startOfDay, $lte: endOfDay } }),
      Payment.aggregate([
        { $match: { hostelId: hId } },
        { $unwind: "$entries" },
        { $match: { "entries.createdAt": { $gte: startOfDay, $lte: endOfDay } } },
        { $group: { _id: null, todayCollection: { $sum: "$entries.amount" } } }
      ])
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
        expenses,
        pendingAdmissions: pendingAdmissionsCount || 0,
        newAdmissionsToday: newAdmissionsTodayCount || 0,
        activeComplaints: 0,
      },
      hostel: hostel
        ? {
            _id: hostel._id,
            id: hostel._id,
            name: hostel.hostelName || hostel.name || "",
            hostelName: hostel.hostelName || hostel.name || "",
            address: hostel.address || "",
            phone: hostel.phone || "",
            qrCodeUrl: hostel.qrCodeUrl || "",
            planType: hostel.planType || "Unified",
          }
        : null,
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
            hostelName: hostel ? (hostel.hostelName || hostel.name || "") : "",
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
    
    const pendingAdmissions = await PublicAdmission.countDocuments({
      hostelId,
      status: "Pending"
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
    logger.error("getAdmissions error:", error?.message || error);
    res.status(500).json({ success: false, message: "Failed to load admissions", error: error?.message || String(error) });
  }
};

// ==========================
// OWNER: GET PENDING ADMISSIONS (ALIAS)
// ==========================
const getPendingAdmissions = async (req, res) => {
  try {
    const { hostelId } = req.owner;
    const admissions = await PublicAdmission.find({ hostelId, status: "Pending" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, admissions });
  } catch (error) {
    logger.error("getPendingAdmissions error:", error?.message || error);
    res.status(500).json({ success: false, message: "Failed to load pending admissions", error: error?.message || String(error) });
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
      logger.error("Resident approval notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Admission approved & Resident created", resident });
  } catch (error) {
    logger.error("approveAdmission error:", error?.message || error);
    res.status(500).json({ success: false, message: "Failed to approve admission", error: error?.message || String(error) });
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
      logger.error("Resident rejection notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Admission rejected" });

  } catch (error) {
    logger.error("rejectAdmission error:", error?.message || error);
    res.status(500).json({ success: false, message: "Failed to reject admission", error: error?.message || String(error) });
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

    const updated = await Hostel.findByIdAndUpdate(hostelId, updates, { returnDocument: "after", runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    logger.info("Saved hostel rules:", updated.rulesText);

    res.status(200).json({
      success: true,
      message: "Hostel settings saved successfully",
      hostel: updated,
    });
  } catch (e) {
    logger.error("updateHostelSettings error:", e);
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
        logger.info("profileImage upload:", req.files.profileImage[0]?.path, req.files.profileImage[0]?.secure_url);
      }
      updates.profileImage =
        req.files.profileImage[0]?.secure_url ||
        getUploadedFileUrl(req.files.profileImage[0]) ||
        req.files.profileImage[0].filename;
    }

    const updated = await Owner.findByIdAndUpdate(ownerId, updates, { returnDocument: "after", runValidators: true });
    if (!updated) return res.status(404).json({ success: false, message: "Owner not found", data: null });

    return res.status(200).json({ success: true, message: "Profile updated", data: { owner: updated } });
  } catch (e) {
    logger.error("updateOwnerProfile error:", e);
    return res.status(500).json({ success: false, message: "Failed to update profile", data: null });
  }
};

const updateOwnerPassword = async (req, res) => {
  try {
    const { ownerId } = req.owner;


    

    const safePasswordCompare = async (plain, stored) => {
      if (!stored) return false;
      if (looksLikeBcryptHash(stored)) {
        return bcrypt.compare(plain, stored);
      }
      return false; // Strict bcrypt only
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

    // Revoke previous active sessions upon password change for security
    try {
      await OwnerSession.updateMany(
        { ownerId: owner._id, isRevoked: false },
        { $set: { isRevoked: true } }
      );
    } catch (sessErr) {
      logger.error("Error revoking sessions on password update:", sessErr);
    }

    return res.status(200).json({ success: true, message: "Password updated", data: {
      firstLogin: owner.firstLogin,
      passwordChanged: owner.passwordChanged,
      mustChangePassword: owner.mustChangePassword,
      onboardingCompleted: owner.onboardingCompleted,
    } });
  } catch (e) {
    logger.error("updateOwnerPassword error:", e);
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
      Hostel.findByIdAndUpdate(hostelId, updatedData, { returnDocument: "after", runValidators: true }),
      Owner.findByIdAndUpdate(
        ownerId,
        { rulesConfigured: true, onboardingStep: 4 },
        { returnDocument: "after" }
      ),
    ]);

    logger.info("OWNER AFTER RULES:", updatedOwner?.onboardingStep);

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
    logger.error("saveOnboardingRules error:", e);
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
      { returnDocument: "after" }
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
    logger.error("completeOnboardingRooms error:", e);
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
      { returnDocument: "after" }
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
    logger.error("completeOnboarding error:", e);
    return res.status(500).json({ success: false, message: "Failed to complete onboarding", data: null });
  }
};

// ==========================
// FORGOT PASSWORD (OWNER SELF-SERVICE)
// ENUMERATION-SAFE NEUTRAL RESPONSE
// ==========================
const forgotPassword = async (req, res) => {
  try {
    const { email, phone, identifier } = req.body || {};
    const inputTerm = String(email || phone || identifier || "").trim();

    if (!inputTerm) {
      return res.status(400).json({
        success: false,
        message: "Please enter your registered email or phone number.",
      });
    }

    // Standard neutral response message to prevent account enumeration
    const neutralMessage = "If an account exists, password reset instructions have been sent.";

    const query = {
      status: { $ne: "disabled" },
      $or: [
        { email: inputTerm.toLowerCase() },
        { phone: inputTerm },
        { username: inputTerm }
      ]
    };

    const owner = await Owner.findOne(query);

    // If owner exists, generate SHA-256 hashed token with 1-hour expiry
    if (owner) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

      owner.resetPasswordToken = hashedToken;
      owner.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      await owner.save();

      // Non-blocking optional notification delivery
      try {
        const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.PUBLIC_URL || (req.headers && req.headers.origin ? req.headers.origin : "https://hostelmate-saas.vercel.app");
        const resetUrl = `${String(frontendBase).replace(/\/$/, "")}/owner/reset-password?token=${rawToken}`;
        logger.info(`Password reset requested for owner ID: ${owner._id}`);
      } catch (err) {
        logger.error("Failed to prepare reset notification:", err);
      }
    }

    // ALWAYS return identical neutral response
    return res.status(200).json({
      success: true,
      message: neutralMessage,
    });
  } catch (error) {
    logger.error("forgotPassword error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error processing password reset request",
    });
  }
};

// ==========================
// RESET PASSWORD WITH TOKEN (OWNER SELF-SERVICE)
// ==========================
const resetPasswordWithToken = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body || {};

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Reset token, new password, and confirmation password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match.",
      });
    }

    // Enforce password strength (min 8 chars, uppercase, lowercase, digit)
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number.",
      });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const owner = await Owner.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!owner) {
      return res.status(400).json({
        success: false,
        message: "Password reset token is invalid or has expired.",
      });
    }

    // Hash new password using bcrypt
    const salt = await bcrypt.genSalt(10);
    owner.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token state and temp password flags
    owner.resetPasswordToken = null;
    owner.resetPasswordExpires = null;
    owner.mustChangePassword = false;
    owner.firstLogin = false;
    owner.passwordChanged = true;
    owner.updatedAt = new Date();

    await owner.save();

    // Revoke all existing sessions upon password reset
    try {
      await OwnerSession.updateMany(
        { ownerId: owner._id, isRevoked: false },
        { $set: { isRevoked: true } }
      );
    } catch (sessErr) {
      logger.error("Error revoking sessions on resetPasswordWithToken:", sessErr);
    }

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    logger.error("resetPasswordWithToken error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
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
  getPendingAdmissions,
  approveAdmission,
  rejectAdmission,
  updateHostelSettings,
  updateOwnerProfile,
  updateOwnerPassword,
  saveOnboardingRules,
  completeOnboardingRooms,
  completeOnboarding,
  forgotPassword,
  resetPasswordWithToken,
};





