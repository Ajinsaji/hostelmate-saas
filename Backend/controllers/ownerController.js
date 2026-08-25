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

    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(now.getTime() + istOffsetMs);
    const startOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 0, 0, 0, 0) - istOffsetMs);
    const endOfDay = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate(), 23, 59, 59, 999) - istOffsetMs);

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
    const mongoose = require("mongoose");
    
    const admission = await PublicAdmission.findOne({ _id: id, hostelId });
    if (!admission) return res.status(404).json({ success: false, message: "Admission request not found" });

    // 1. Idempotency & Status verification
    if (admission.status === "Approved") {
      return res.status(400).json({ success: false, message: "Admission has already been approved." });
    }
    if (admission.status === "Rejected") {
      return res.status(400).json({ success: false, message: "Cannot approve a rejected admission." });
    }

    // 2. Resolve room preference with tenant scoping
    const targetRoomId = req.body.roomId || admission.roomPreference;
    let room = null;

    if (targetRoomId && mongoose.Types.ObjectId.isValid(targetRoomId)) {
      room = await Room.findOne({ _id: targetRoomId, hostelId });
    }

    // If preferred room is not an ObjectId or room not found, find first room in hostel with vacant beds
    if (!room || (room.occupiedBeds || 0) >= (room.totalBeds || 0)) {
      const availableRooms = await Room.find({ hostelId });
      room = availableRooms.find((r) => (r.occupiedBeds || 0) < (r.totalBeds || 0));
    }

    if (!room) {
      return res.status(400).json({
        success: false,
        message: "No vacant room or bed available in this hostel. Please create or free a bed first."
      });
    }

    // 3. Assign a vacant bed in the selected room (case-insensitive status)
    let bed = await Bed.findOne({ roomId: room._id, hostelId, status: { $in: ["Vacant", "vacant"] }, isDeleted: false });
    if (!bed) {
      bed = await Bed.findOne({ hostelId, status: { $in: ["Vacant", "vacant"] }, isDeleted: false });
    }

    // 4. Generate sequential admission number & parse names
    const now = new Date();
    const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
    const count = await Resident.countDocuments({ hostelId });
    const admissionNumber = `ADM-${yearMonth}-${String(count + 1).padStart(4, "0")}`;

    const fullName = (admission.residentName || "Resident").trim();
    const nameParts = fullName.split(" ");
    const firstName = nameParts[0] || "Resident";
    const lastName = nameParts.slice(1).join(" ") || "";

    // 5. Create Resident document
    const resident = await Resident.create({
      tenantId: hostelId,
      hostelId,
      admissionNumber,
      firstName,
      lastName,
      fullName,
      name: fullName,
      phone: admission.phone,
      email: admission.email || "",
      emergencyContact: admission.emergencyContact || "",
      address: admission.address || "",
      roomId: room._id,
      bedId: bed?._id || null,
      monthlyRent: room.rentPerBed || 0,
      depositAmount: 0,
      joiningDate: new Date(),
      joinDate: new Date(),
      status: "active",
      idProof: admission.idProofFile || "",
      photo: admission.photoFile || "",
      createdBy: req.owner?.ownerId || null,

      // Immutable consent snapshot copied from PublicAdmission at approval time
      rulesVersionId: admission.rulesVersionId || "",
      rulesVersionNumber: admission.rulesVersionNumber || "",
      acceptedRulesTextSnapshot: admission.acceptedRulesTextSnapshot || "",
      signatureImage: admission.signatureImage || "",
      signedAt: admission.signedAt || new Date(),
      agreementChecked: Boolean(admission.agreementChecked),
    });

    // 6. Update admission status
    admission.status = "Approved";
    await admission.save();

    // 7. Update Bed & Room occupancy
    if (bed) {
      await Bed.findByIdAndUpdate(bed._id, {
        $set: { status: "Occupied", residentId: resident._id }
      });
    }

    await Room.findByIdAndUpdate(room._id, {
      $inc: { occupiedBeds: 1 }
    });

    // 8. Publish notification
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      await publishNotification({
        userId: req.owner?.ownerId,
        hostelId,
        type: "resident_approved",
        title: "Resident Approved",
        message: `Resident ${resident.fullName} approved and assigned to room ${room.roomNumber}`,
        meta: {
          route: "/admissions",
          residentId: resident?._id || null,
          admissionId: admission?._id || null,
        },
      });
    } catch (e) {
      logger.error("Resident approval notification failed:", e?.message || e);
    }

    res.status(200).json({
      success: true,
      message: "Admission approved & Resident created successfully",
      resident,
      admission
    });
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
    if (!admission) return res.status(404).json({ success: false, message: "Admission request not found" });

    // Idempotency & status check
    if (admission.status === "Rejected") {
      return res.status(400).json({ success: false, message: "Admission has already been rejected." });
    }
    if (admission.status === "Approved") {
      return res.status(400).json({ success: false, message: "Cannot reject an already approved admission." });
    }

    admission.status = "Rejected";
    if (req.body.reason) {
      admission.rejectionReason = String(req.body.reason).trim();
    }
    await admission.save();

    // Notification for rejection
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      await publishNotification({
        userId: req.owner?.ownerId,
        hostelId,
        type: "resident_rejected",
        title: "Admission Rejected",
        message: `Admission for ${admission.residentName} was rejected.`,
        meta: {
          route: "/admissions",
          admissionId: admission?._id || null,
        },
      });

      // EventBus dispatch for WhatsApp applicant rejection update
      const EventBus = require("../services/EventBus");
      const Hostel = require("../models/Hostel");
      const hostelDoc = await Hostel.findById(hostelId).select("hostelName name").lean();
      EventBus.emit("ADMISSION_REJECTED", {
        admissionId: admission._id,
        hostelId,
        hostelName: hostelDoc?.hostelName || hostelDoc?.name || "HostelMate",
        applicantName: admission.residentName || admission.fullName || "Applicant",
        phone: admission.phone,
        referenceId: String(admission._id),
        rejectionReason: admission.rejectionReason || "Not specified",
        status: "Rejected",
      });
    } catch (e) {
      logger.error("Resident rejection notification failed:", e?.message || e);
    }

    res.status(200).json({ success: true, message: "Admission rejected successfully", admission });

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

/**
 * GET /api/owner/profile
 * Returns authenticated owner's details and active hostels list
 */
const getOwnerProfile = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const owner = await Owner.findById(ownerId).select("-password -resetPasswordToken -resetPasswordExpires").lean();
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const hostels = await Hostel.find({
      $or: [{ ownerId: owner._id }, { _id: owner.hostelId }],
      isDeleted: { $ne: true }
    }).select("hostelName name address city state pincode capacity status publicCode uniqueCode isPublic").lean();

    return res.status(200).json({
      success: true,
      owner,
      hostels,
      existingHostelsCount: hostels.length
    });
  } catch (error) {
    logger.error("getOwnerProfile error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching owner profile" });
  }
};

/**
 * GET /api/owner/hostels
 * Returns list of all hostels owned by this authenticated owner
 */
const getOwnerHostels = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const owner = await Owner.findById(ownerId).lean();
    const hostels = await Hostel.find({
      $or: [{ ownerId }, { _id: owner?.hostelId }],
      isDeleted: { $ne: true }
    }).select("hostelName name address city state pincode capacity status publicCode uniqueCode isPublic isTrial subscriptionStatus").lean();

    return res.status(200).json({
      success: true,
      hostels,
      count: hostels.length
    });
  } catch (error) {
    logger.error("getOwnerHostels error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching owner hostels" });
  }
};

/**
 * POST /api/owner/hostels/add
 * Dedicated workflow for existing owner to register an additional hostel
 */
const submitAdditionalHostelRequest = async (req, res) => {
  try {
    const ownerId = req.owner?.ownerId || req.user?.userId;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const owner = await Owner.findById(ownerId);
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner profile not found" });
    }

    const {
      hostelName,
      hostelAddress,
      pincode,
      state,
      district,
      city,
      hostelType = "Co-Living",
      capacity = 0,
      roomsCount = 0,
      amenities = []
    } = req.body;

    // 1. Mandatory Field Validations
    if (!hostelName || !hostelName.trim()) {
      return res.status(400).json({ success: false, message: "Hostel Name is required" });
    }
    if (!hostelAddress || !hostelAddress.trim()) {
      return res.status(400).json({ success: false, message: "Hostel Address is required" });
    }
    if (!pincode || !/^\d{6}$/.test(String(pincode).trim())) {
      return res.status(400).json({ success: false, message: "Please provide a valid 6-digit Indian PIN code" });
    }

    // 2. License Document Requirement
    let licensePhoto = req.body.licensePhoto || "";
    if (req.file) {
      licensePhoto = req.file.path || req.file.url || req.file.filename || "";
    } else if (req.files?.licensePhoto?.[0]) {
      const f = req.files.licensePhoto[0];
      licensePhoto = f.path || f.url || f.filename || "";
    }

    if (!licensePhoto) {
      return res.status(400).json({
        success: false,
        message: "New Hostel License document is required. Please upload the license document for this specific hostel."
      });
    }

    const cleanHostelName = hostelName.trim();
    const cleanHostelAddress = hostelAddress.trim();

    // 3. Duplicate Prevention: Check active hostels
    const existingActiveHostel = await Hostel.findOne({
      $or: [{ ownerId: owner._id }, { _id: owner.hostelId }],
      hostelName: { $regex: new RegExp(`^${cleanHostelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      isDeleted: { $ne: true }
    });

    if (existingActiveHostel) {
      return res.status(400).json({
        success: false,
        message: `You already have an active hostel named "${cleanHostelName}". Please use a distinct name.`
      });
    }

    // Duplicate Prevention: Check pending requests
    const existingPendingRequest = await HostelRequest.findOne({
      ownerId: owner._id,
      hostelName: { $regex: new RegExp(`^${cleanHostelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
      status: { $in: ["pending", "activation_pending", "approved"] }
    });

    if (existingPendingRequest) {
      return res.status(400).json({
        success: false,
        message: `You already have a pending registration request for "${cleanHostelName}".`
      });
    }

    const HostelRequest = require("../models/HostelRequest");

    // 4. Create HostelRequest with Existing Owner linkage
    const newRequest = await HostelRequest.create({
      ownerName: owner.ownerName,
      phone: owner.phone,
      email: owner.email || "",
      ownerAddress: owner.address || owner.ownerAddress || cleanHostelAddress,
      ownerId: owner._id,
      isExistingOwner: true,
      source: "existing_owner",
      hostelName: cleanHostelName,
      hostelAddress: cleanHostelAddress,
      state: state || "",
      district: district || "",
      city: city || "",
      pincode: String(pincode).trim(),
      hostelType,
      capacity: Number(capacity) || 0,
      roomsCount: Number(roomsCount) || 0,
      amenities: Array.isArray(amenities) ? amenities : [],
      licensePhoto,
      status: "pending",
      timeline: [
        {
          action: `Submitted additional hostel application for "${cleanHostelName}" by existing owner`,
          by: owner.ownerName,
          date: new Date()
        }
      ]
    });

    logger.info({
      operation: "submitAdditionalHostelRequest",
      ownerId: String(owner._id),
      requestId: String(newRequest._id),
      hostelName: cleanHostelName
    }, "Additional hostel registration request submitted");

    return res.status(201).json({
      success: true,
      message: "New hostel application submitted successfully. It will be reviewed by our team shortly.",
      requestId: newRequest._id,
      request: newRequest
    });
  } catch (error) {
    logger.error("submitAdditionalHostelRequest error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to submit hostel application" });
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
  getOwnerProfile,
  getOwnerHostels,
  submitAdditionalHostelRequest,
};





