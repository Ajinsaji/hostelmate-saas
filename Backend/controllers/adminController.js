const HostelRequest = require("../models/HostelRequest");

const Hostel = require("../models/Hostel");

const Subscription = require("../models/Subscription");

const Owner = require("../models/Owner");

const Room = require("../models/Room");
const Bed = require("../models/Bed");
const Resident = require("../models/Resident");
const Payment = require("../models/Payment");
const Notification = require("../models/Notification");
const DeviceToken = require("../models/DeviceToken");
const PublicAdmission = require("../models/PublicAdmission");
const SupportTicket = require("../models/SupportTicket");
const AuditLog = require("../models/AuditLog");
const SubscriptionHistory = require("../models/SubscriptionHistory");
const HostelSubscription = require("../models/HostelSubscription");

const { generateQRCode } = require('../utils/qrCodeService');
const { sendApprovalMessages } = require('../utils/messageService');
const mongoose = require("mongoose");




// ==========================
// DASHBOARD STATS
// ==========================

const getDashboardStats =
  async (req, res) => {
    try {

      const pendingHostels =
        await HostelRequest.countDocuments({ status: "pending" });

      const activeHostels =
        await Hostel.countDocuments({ isDeleted: { $ne: true } });

      const subscriptions =
        await Subscription.find();

      let revenue = 0;

      subscriptions.forEach(
        (sub) => {
          revenue +=
            sub.amount || 0;
        }
      );

      res.status(200).json({
        success: true,

        pendingHostels,

        activeHostels,

        revenue,
      });

    } catch (error) {

      console.log(error);

      res.status(500).json(error);

    }
  };


// ==========================
// GET ALL REQUESTS (WITH SEARCH, STATUS FILTER, COUNTS, PAGINATION)
// ==========================

const getAllRequests = async (req, res) => {
  try {
    const {
      status = "",
      search = "",
      page = 1,
      limit = 50,
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query || {};

    const query = {};

    // Canonical status filtering matching enum: pending | activation_pending | approved | activated | rejected
    const rawStatus = String(status || "").trim().toLowerCase();
    if (rawStatus && rawStatus !== "all" && rawStatus !== "all statuses") {
      query.status = { $regex: new RegExp(`^${rawStatus}$`, "i") };
    }

    // Search across hostelName, ownerName, phone, city, district, email
    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const searchRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [
        { hostelName: searchRegex },
        { ownerName: searchRegex },
        { phone: searchRegex },
        { city: searchRegex },
        { district: searchRegex },
        { email: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await HostelRequest.countDocuments(query);
    const requests = await HostelRequest.find(query)
      .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Canonical status count breakdown for dashboard & UI pills
    const [pendingCount, activationPendingCount, approvedCount, activatedCount, rejectedCount, totalAll] = await Promise.all([
      HostelRequest.countDocuments({ status: { $regex: /^pending$/i } }),
      HostelRequest.countDocuments({ status: { $regex: /^activation_pending$/i } }),
      HostelRequest.countDocuments({ status: { $regex: /^approved$/i } }),
      HostelRequest.countDocuments({ status: { $regex: /^activated$/i } }),
      HostelRequest.countDocuments({ status: { $regex: /^rejected$/i } }),
      HostelRequest.countDocuments({}),
    ]);

    const { resolveOwnerDocuments, normalizeAssetUrl } = require("../utils/documentResolver");
    const formattedRequests = requests.map((reqItem) => {
      const docs = resolveOwnerDocuments(reqItem);
      return {
        ...reqItem,
        ownerPhoto: docs.ownerPhotoUrl || normalizeAssetUrl(reqItem.ownerPhoto) || "",
        ownerPhotoUrl: docs.ownerPhotoUrl || "",
        aadhaarFile: docs.aadhaarUrl || normalizeAssetUrl(reqItem.aadhaarFile) || "",
        aadhaarUrl: docs.aadhaarUrl || "",
        licensePhoto: docs.licenseUrl || normalizeAssetUrl(reqItem.licensePhoto) || "",
        licenseUrl: docs.licenseUrl || "",
        documents: docs,
      };
    });

    return res.status(200).json({
      success: true,
      requests: formattedRequests,
      data: formattedRequests,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      counts: {
        all: totalAll,
        pending: pendingCount,
        activation_pending: activationPendingCount,
        approved: approvedCount,
        activated: activatedCount,
        rejected: rejectedCount,
      },
    });
  } catch (error) {
    console.error("getAllRequests error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch requests", error: error?.message });
  }
};

// ==========================
// DELETE / REMOVE REQUEST (SAFE ISOLATION)
// ==========================

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID format" });
    }

    const request = await HostelRequest.findById(id);
    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // Safety boundary: only the registration request document itself is removed.
    // Active Hostel, Owner, Subscription, Payment, and Resident documents are never touched.
    await HostelRequest.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Registration request for "${request.hostelName || 'Hostel'}" removed successfully`,
    });
  } catch (error) {
    console.error("deleteRequest error:", error);
    return res.status(500).json({ success: false, message: "Failed to remove request", error: error?.message });
  }
};


// ==========================
// APPROVE HOSTEL
// ==========================

const approveHostel = async (req, res) => {
  try {
    const request = await HostelRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    const existingDraft = await Hostel.findOne({
      phone: request.phone,
    }).lean();

    if (existingDraft) {
      return res.status(200).json({
        success: false,
        activationAlreadyStarted: true,
        hostelId: existingDraft._id,
        message: "Hostel already exists",
      });
    }

    const { approveHostelRegistration } = require("../services/onboardingService");
    const result = await approveHostelRegistration({
      hostelName: request.hostelName,
      ownerName: request.ownerName,
      email: request.email || "",
      phone: request.phone,
      city: request.city || "",
      address: request.hostelAddress || "",
      coverImage: request.coverImage || "",
      logo: request.logo || "",
      aadhaarFile: request.aadhaarFile || "",
      licensePhoto: request.licensePhoto || ""
    });

    request.status = "activation_pending";
    request.hostelId = String(result.hostel._id);
    if (!request.timeline) request.timeline = [];
    request.timeline.push({ action: "Approved - Activation Pending", by: "SuperAdmin" });
    await request.save();

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      hostelId: result.hostel._id,
      action: "APPROVE_REGISTRATION",
      actionType: "APPROVE",
      entity: "HostelRequest",
      targetId: request._id,
      details: {
        hostelName: request.hostelName,
        ownerName: request.ownerName,
        phone: request.phone,
        message: `Approved hostel registration for ${request.hostelName} (${request.ownerName})`
      },
      timestamp: new Date()
    }).catch(() => {});

    // NOTIFICATION: Hostel request approved by admin (Pending Activation)
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Admin = require("../models/Admin");
      const superAdmins = await Admin.find({ role: { $in: ["super_admin", "admin"] } });
      
      for (const admin of superAdmins || []) {
        await publishNotification({
          userId: admin._id,
          type: "system_update",
          title: "Hostel Request Approved",
          message: `${result.hostel.name} - Activation Pending (Subscription Setup Required)`,
          meta: { route: "/admin/hostels", relatedId: result.hostel._id },
          role: admin.role,
        });
      }
    } catch (e) {
      console.error("Hostel approval notification failed:", e?.message || e);
    }

    return res.status(200).json({
      success: true,
      hostelId: result.hostel._id,
      status: "activation_pending",
      requiresSubscriptionSetup: true,
      message: "Hostel request approved. Subscription setup required for final activation.",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

// ==========================
// FINALIZE HOSTEL ACTIVATION
// SINGLE SOURCE OF TRUTH FOR ACTIVATION
// ==========================

const finalizeHostelActivation = async (req, res) => {
  try {
    const rawTargetId = req.params.hostelId || req.params.id;
    const { planType, amount, startDate, endDate, isTrial, isFreeAccess, notes } = req.body || {};

    if (!rawTargetId) {
      return res.status(400).json({
        success: false,
        code: "TARGET_ID_REQUIRED",
        message: "Hostel ID or Request ID is required for activation",
      });
    }

    // 1. Resolve Target Hostel (gracefully handle both Hostel._id and HostelRequest._id)
    let hostel = await Hostel.findById(rawTargetId);
    let relatedRequest = null;

    if (!hostel) {
      relatedRequest = await HostelRequest.findById(rawTargetId);
      if (relatedRequest?.hostelId) {
        hostel = await Hostel.findById(relatedRequest.hostelId);
      }
    }

    if (!hostel) {
      return res.status(404).json({
        success: false,
        code: "HOSTEL_NOT_FOUND",
        message: "Hostel document not found for activation.",
      });
    }

    // 2. Validate Lifecycle + Trash Gating
    if (hostel.isDeleted === true) {
      return res.status(400).json({
        success: false,
        code: "HOSTEL_IN_TRASH",
        message: "Hostel is currently in Trash and cannot be activated.",
      });
    }

    // Strict Idempotency: Reject already activated hostels
    if (hostel.pendingActivation === false) {
      return res.status(400).json({
        success: false,
        code: "HOSTEL_ALREADY_ACTIVATED",
        message: "Hostel already activated",
      });
    }

    // 3. Validate Owner Conflicts
    const existingOwnerByHostel = await Owner.findOne({ hostelId: hostel._id });
    if (existingOwnerByHostel) {
      return res.status(400).json({
        success: false,
        code: "HOSTEL_ALREADY_ACTIVATED",
        message: "Hostel already activated",
      });
    }

    const existingOwnerByPhone = await Owner.findOne({ phone: hostel.phone });
    if (existingOwnerByPhone) {
      if (String(existingOwnerByPhone.hostelId) === String(hostel._id)) {
        return res.status(400).json({
          success: false,
          code: "HOSTEL_ALREADY_ACTIVATED",
          message: "Hostel already activated",
        });
      }
      return res.status(409).json({
        success: false,
        code: "OWNER_PHONE_CONFLICT",
        message: `An owner account with phone number ${hostel.phone} already exists.`,
      });
    }

    // 4. Ensure Public Code & Canonical URL are present and valid
    const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.PUBLIC_URL || (req.headers && req.headers.origin ? req.headers.origin : "https://hostelmate-saas.vercel.app");
    const cleanFrontendBase = String(frontendBase).replace(/\/$/, "");

    if (!hostel.publicCode || !/^\d{10}$/.test(hostel.publicCode)) {
      const { generateUniquePublicCode } = require("../utils/publicCodeGenerator");
      hostel.publicCode = await generateUniquePublicCode(Hostel);
      hostel.uniqueCode = hostel.publicCode;
      hostel.publicUrl = `${cleanFrontendBase}/h/${hostel.publicCode}`;
    }

    // 5. Subscription Preparation (Idempotent reuse or creation)
    const isTrialMode = isTrial !== undefined ? !!isTrial : true;
    const normalizedPlanType = "HostelMate Unified Plan";
    const finalStartDate = startDate ? new Date(startDate) : new Date();
    const finalEndDate = endDate ? new Date(endDate) : new Date(finalStartDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const subStatus = isTrialMode ? "trial" : "active";

    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const formattedExpiryDate = `${finalEndDate.getDate()} ${months[finalEndDate.getMonth()]} ${finalEndDate.getFullYear()}`;

    let subscriptionDoc = await Subscription.findOne({ hostelId: hostel._id });
    if (subscriptionDoc) {
      subscriptionDoc.planType = normalizedPlanType;
      subscriptionDoc.plan = normalizedPlanType;
      subscriptionDoc.status = subStatus;
      subscriptionDoc.subscriptionStatus = subStatus;
      subscriptionDoc.isTrial = isTrialMode;
      subscriptionDoc.startDate = finalStartDate;
      subscriptionDoc.endDate = finalEndDate;
      subscriptionDoc.trialStartDate = finalStartDate;
      subscriptionDoc.trialEndDate = finalEndDate;
      subscriptionDoc.subscriptionStartDate = finalStartDate;
      subscriptionDoc.subscriptionEndDate = finalEndDate;
      subscriptionDoc.trialDays = 30;
      subscriptionDoc.isFreeAccess = !!isFreeAccess;
      subscriptionDoc.amount = Number(amount ?? subscriptionDoc.amount ?? 0);
      subscriptionDoc.paidAmount = isTrialMode ? 0 : Number(amount ?? subscriptionDoc.amount ?? 0);
      subscriptionDoc.paid = !isTrialMode && Number(subscriptionDoc.paidAmount) > 0;
      subscriptionDoc.paymentStatus = isTrialMode ? "Pending" : (subscriptionDoc.paid ? "Paid" : "Pending");
      subscriptionDoc.monthlyRatePerResident = 10;
      subscriptionDoc.notes = notes || subscriptionDoc.notes || "";
      await subscriptionDoc.save();
    } else {
      subscriptionDoc = await Subscription.create({
        hostelId: hostel._id,
        planType: normalizedPlanType,
        plan: normalizedPlanType,
        status: subStatus,
        subscriptionStatus: subStatus,
        isTrial: isTrialMode,
        startDate: finalStartDate,
        endDate: finalEndDate,
        trialStartDate: finalStartDate,
        trialEndDate: finalEndDate,
        subscriptionStartDate: finalStartDate,
        subscriptionEndDate: finalEndDate,
        trialDays: 30,
        residentLimit: 999999,
        isFreeAccess: !!isFreeAccess,
        amount: Number(amount ?? 0),
        paidAmount: isTrialMode ? 0 : Number(amount ?? 0),
        paid: !isTrialMode && Number(amount ?? 0) > 0,
        paymentStatus: isTrialMode ? "Pending" : (Number(amount ?? 0) > 0 ? "Paid" : "Pending"),
        monthlyRatePerResident: 10,
        notes: notes || "",
      });
    }

    // 6. Generate Temporary Password and Create Owner
    const tempPassword = `HM${Math.floor(1000 + Math.random() * 9000)}@${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10 + Math.random() * 90)}`;
    const bcryptjs = require("bcryptjs");
    const hashedPassword = await bcryptjs.hash(tempPassword, 10);

    if (!relatedRequest) {
      relatedRequest = await HostelRequest.findOne({
        $or: [{ hostelId: String(hostel._id) }, { phone: hostel.phone }]
      });
    }

    const ownerEmail = hostel.email || relatedRequest?.email || "";

    const ownerPayload = {
      hostelId: hostel._id,
      activeHostelId: hostel._id,
      ownerName: hostel.ownerName || "Hostel Owner",
      phone: hostel.phone,
      email: ownerEmail,
      username: hostel.phone,
      password: hashedPassword,
      mustChangePassword: true,
      firstLogin: true,
      onboardingCompleted: false,
      passwordChanged: false,
      rulesConfigured: false,
      roomsConfigured: false,
      role: "owner",
      status: "active",
      profileImage: hostel.ownerPhoto || "",
      credentialIssuedAt: new Date(),
      credentialDeliveryStatus: "issued",
    };

    const createdOwner = await Owner.create(ownerPayload);

    // Link owner to subscription
    subscriptionDoc.ownerId = createdOwner._id;
    await subscriptionDoc.save();

    // Sync HostelSubscription
    try {
      await HostelSubscription.findOneAndUpdate(
        { hostelId: hostel._id },
        {
          hostelId: hostel._id,
          status: isTrialMode ? "Trial" : "Active",
          trialStartDate: finalStartDate,
          trialEndDate: finalEndDate,
          subscriptionStartDate: finalStartDate,
          currentCycleStart: finalStartDate,
          currentCycleEnd: finalEndDate,
          nextBillingDate: finalEndDate,
          paymentStatus: isTrialMode ? "Pending" : "Paid",
          totalAmount: subscriptionDoc.amount,
        },
        { upsert: true, new: true }
      );
    } catch (hsErr) {
      console.warn("HostelSubscription sync warning:", hsErr?.message);
    }

    // Log Subscription History
    try {
      await SubscriptionHistory.create({
        hostelId: hostel._id,
        ownerId: createdOwner._id,
        subscriptionId: subscriptionDoc._id,
        action: isTrialMode ? "TRIAL_STARTED" : "CONTINUATION_APPROVED",
        newStartDate: finalStartDate,
        newEndDate: finalEndDate,
        newAmount: subscriptionDoc.amount,
        changedBy: req.user?.name || req.user?.role || "SuperAdmin",
        reason: isTrialMode ? "30-day Free Trial Started on Activation" : "Active Subscription on Activation",
      });
    } catch (histErr) {
      console.warn("SubscriptionHistory log warning:", histErr?.message);
    }

    // 7. Update Hostel & Mark Activated
    hostel.ownerId = createdOwner._id;
    hostel.owner = createdOwner._id;
    hostel.pendingActivation = false;
    hostel.subscriptionStatus = subscriptionDoc.subscriptionStatus;
    hostel.planType = subscriptionDoc.planType;
    hostel.subscriptionStartDate = subscriptionDoc.subscriptionStartDate;
    hostel.subscriptionEndDate = subscriptionDoc.subscriptionEndDate;
    hostel.isFreeAccess = subscriptionDoc.isFreeAccess;
    hostel.isTrial = subscriptionDoc.isTrial;

    await hostel.save();

    // 8. Update HostelRequest Status (activated)
    if (relatedRequest) {
      relatedRequest.status = "activated";
      if (!relatedRequest.timeline) relatedRequest.timeline = [];
      relatedRequest.timeline.push({ action: "Activated & Credentials Generated", by: req.user?.role || "SuperAdmin" });
      await relatedRequest.save();
    }

    // 9. Construct canonical Owner Login URL
    const loginUrl = `${cleanFrontendBase}/owner/login`;

    // 10. Canonical One-Time EventBus Notification & Credential Delivery (Isolated & Non-blocking)
    try {
      const EventBus = require("../services/EventBus");
      EventBus.emit("OWNER_ACCOUNT_ACTIVATED", {
        hostelId: hostel._id,
        ownerId: createdOwner._id,
        phone: createdOwner.phone,
        ownerName: createdOwner.ownerName,
        hostelName: hostel.hostelName,
        username: createdOwner.phone,
        tempPassword,
        planType: "HostelMate Unified Plan",
        expiryDate: formattedExpiryDate,
        loginUrl,
      });

      createdOwner.credentialDeliveryStatus = "sent";
      await createdOwner.save();
    } catch (eventErr) {
      console.error("[EventBus] OWNER_ACCOUNT_ACTIVATED emission error (non-blocking):", eventErr?.message);
      createdOwner.credentialDeliveryStatus = "failed";
      await createdOwner.save().catch(() => {});
    }

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      hostelId: hostel._id,
      action: "FINALIZE_ACTIVATION",
      actionType: "ACTIVATE",
      entity: "Hostel",
      targetId: hostel._id,
      details: {
        hostelName: hostel.hostelName || hostel.name,
        planType: "HostelMate Unified Plan",
        amount: amount || 0,
        message: `Finalized hostel activation for ${hostel.hostelName || hostel.name} with HostelMate Unified Plan`
      },
      timestamp: new Date()
    }).catch(() => {});

    // 12. Return Controlled HTTP 200 Activation Response
    return res.status(200).json({
      success: true,
      message: "Hostel activated successfully",
      hostelId: hostel._id,
      ownerId: createdOwner._id,
      owner: {
        id: createdOwner._id,
        fullName: createdOwner.ownerName,
        phone: createdOwner.phone,
        email: createdOwner.email,
      },
      credentials: {
        loginUrl,
        tempPassword,
        temporaryPassword: tempPassword,
        username: hostel.phone,
        issuedAt: createdOwner.credentialIssuedAt,
      },
      credentialDelivery: {
        status: createdOwner.credentialDeliveryStatus,
      },
      loginUrl,
      credentialStatus: createdOwner.credentialDeliveryStatus,
    });
  } catch (error) {
    console.error("finalizeHostelActivation error:", error?.message || error);

    // Handle Mongo E11000 duplicate key errors cleanly without exposing internals or returning 500
    if (error?.code === 11000 || error?.name === "MongoServerError") {
      const duplicateField = Object.keys(error.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        code: "DUPLICATE_KEY_CONFLICT",
        message: `An account or record already exists with this ${duplicateField}.`,
        field: duplicateField,
      });
    }

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: error.message || "Invalid activation parameters.",
      });
    }

    return res.status(500).json({
      success: false,
      code: "ACTIVATION_FAILED",
      message: "Unable to complete hostel activation. Please try again.",
    });
  }
};


// ==========================
// REJECT REQUEST
// ==========================

const rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body || {};
    const updated = await HostelRequest.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason: reason || "Rejected by Superadmin",
        $push: { timeline: { action: `Rejected: ${reason || 'No reason provided'}`, by: req.user?.role || "SuperAdmin", date: new Date() } }
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      action: "REJECT_REGISTRATION",
      actionType: "REJECT",
      entity: "HostelRequest",
      targetId: updated._id,
      details: {
        hostelName: updated.hostelName,
        ownerName: updated.ownerName,
        reason: reason || "Rejected by Superadmin",
        message: `Rejected registration for ${updated.hostelName}: ${reason || "No reason provided"}`
      },
      timestamp: new Date()
    }).catch(() => {});

    res.status(200).json({
      success: true,
      message: "Request Rejected",
      request: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminsTeam = async (req, res) => {
  try {
    const Admin = require("../models/Admin");
    const admins = await Admin.find({ status: "active" }).select("_id fullName username email role").lean();
    
    const teamMembers = (admins || []).map(a => ({
      id: a._id,
      name: a.fullName || a.username,
      email: a.email,
      role: a.role === "super_admin" ? "Super Admin" : "Operations Admin"
    }));

    // Fallback standard verification teams if single admin account
    if (teamMembers.length <= 1) {
      teamMembers.push(
        { id: "team-verification", name: "Verification Team", role: "Compliance & Audit" },
        { id: "team-operations", name: "Operations Team", role: "Onboarding Ops" },
        { id: "team-compliance", name: "Compliance Team", role: "Legal & Regulatory" }
      );
    }

    res.status(200).json({
      success: true,
      team: teamMembers
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, teamName } = req.body || {};
    
    const assigneeName = teamName || adminId || "Operations Team";
    const updatePayload = {
      assignedTeam: assigneeName,
      assignedAt: new Date(),
      assignedBy: req.user?.fullName || req.user?.username || req.user?.role || "SuperAdmin",
      $push: { timeline: { action: `Assigned to ${assigneeName}`, by: req.user?.fullName || req.user?.role || "SuperAdmin", date: new Date() } }
    };

    if (mongoose.Types.ObjectId.isValid(adminId)) {
      updatePayload.assignedTo = adminId;
    }

    const request = await HostelRequest.findByIdAndUpdate(
      id,
      updatePayload,
      { returnDocument: "after" }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.status(200).json({ success: true, message: `Assigned to ${assigneeName}`, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};


// ==========================
// GET PENDING HOSTELS (activation pending)
// ==========================

const getPendingHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find({ pendingActivation: true }).lean();

    const result = [];

    for (const hostel of hostels || []) {
      const hostelRequest = await HostelRequest.findOne({ hostelId: hostel._id }).lean();

      result.push({
        hostelId: hostel._id,
        ...hostel,
        hostelRequest: {
          hostelName: hostelRequest?.hostelName || "",
          ownerName: hostelRequest?.ownerName || "",
          phone: hostelRequest?.phone || "",
          hostelType: hostelRequest?.hostelType || "",
          state: hostelRequest?.state || "",
          district: hostelRequest?.district || "",
          city: hostelRequest?.city || "",
          pincode: hostelRequest?.pincode || "",
        },
      });
    }

    return res.status(200).json({ success: true, hostels: result });
  } catch (error) {
    console.error("Error fetching pending hostels:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch pending hostels" });
  }
};

// ==========================
// GET ALL HOSTELS
// ==========================

const getAllHostels = async (req, res) => {
  try {
    const { getHostelDirectory } = require("../services/hostels/hostelDirectoryService");
    const {
      page = 1,
      pageSize = 25,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      status = "",
      plan = "",
      city = "",
      district = "",
      state = ""
    } = req.query || {};

    const directoryResult = await getHostelDirectory({
      page: parseInt(page, 10) || 1,
      pageSize: parseInt(pageSize, 10) || 25,
      search: String(search || "").trim(),
      sortField,
      sortOrder,
      filters: {
        status: status || req.query.subscription,
        plan,
        city,
        district,
        state
      }
    });

    // Ensure full compatibility with legacy expectations
    const fullHostels = (directoryResult.data || []).map((h) => ({
      ...h,
      hostelId: h.id || h._id,
      hostelName: h.name || h.hostelName,
      ownerName: h.owner,
      phone: h.phone,
      email: h.email,
      ownerPhoto: h.ownerPhoto,
      subscriptionStatus: h.status,
      planType: h.plan,
      owner: {
        name: h.owner,
        email: h.email,
        phone: h.phone,
        profileImage: h.ownerPhoto
      }
    }));

    return res.status(200).json({
      success: true,
      hostels: fullHostels,
      data: fullHostels,
      pagination: directoryResult.pagination,
      meta: directoryResult.meta
    });
  } catch (error) {
    console.error("Error fetching hostels:", error);
    res.status(500).json({ success: false, message: "Failed to fetch hostels", error: error?.message });
  }
};

// ==========================
// SEND CREDENTIALS & RESEND WHATSAPP
// TRUTHFUL CREDENTIAL DELIVERY (NO FAKE SUCCESS)
// ==========================
const sendCredentials = async (req, res) => {
  try {
    const ownerId = req.params.ownerId || req.params.id;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID or Hostel ID is required",
      });
    }

    let owner = await Owner.findById(ownerId);
    if (!owner && mongoose.Types.ObjectId.isValid(ownerId)) {
      owner = await Owner.findOne({ hostelId: ownerId });
    }

    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const hostel = owner.hostelId ? await Hostel.findById(owner.hostelId) : null;

    // Check if delivery infrastructure (Meta Cloud WhatsApp API) is configured
    const { validateWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");
    const config = validateWhatsAppConfig();

    if (!config.isConfigured) {
      owner.credentialDeliveryStatus = "unconfigured";
      owner.lastDeliveryError = config.reason || "WhatsApp credential delivery service is not configured.";
      await owner.save();
      return res.status(200).json({
        success: false,
        unconfigured: true,
        deliveryStatus: "unconfigured",
        message: "WhatsApp credential delivery service is not configured.",
      });
    }

    // Call real WhatsApp delivery
    const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.PUBLIC_URL || (req.headers && req.headers.origin ? req.headers.origin : "https://hostelmate-saas.vercel.app");
    const loginUrl = `${String(frontendBase).replace(/\/$/, "")}/owner/login`;

    const { sendOwnerOnboarding } = require("../utils/sendOwnerOnboarding");
    const result = await sendOwnerOnboarding({
      ownerName: owner.ownerName,
      hostelName: hostel ? hostel.hostelName : "",
      phone: owner.phone,
      username: owner.username || owner.phone,
      tempPassword: "[Issued Credentials]",
      planType: hostel ? hostel.planType : "Pro",
      expiryDate: hostel ? hostel.subscriptionEndDate : null,
      qrUrl: hostel ? hostel.qrCodeUrl : "",
      loginUrl,
    });

    if (result && (result.skipped || result.unconfigured)) {
      owner.credentialDeliveryStatus = "unconfigured";
      owner.lastDeliveryError = result.message || "WhatsApp credential delivery service is not configured.";
      await owner.save();
      return res.status(200).json({
        success: false,
        unconfigured: true,
        deliveryStatus: "unconfigured",
        message: "WhatsApp credential delivery service is not configured.",
      });
    }

    owner.credentialDeliveryStatus = "sent";
    owner.lastDeliveryError = null;
    await owner.save();

    return res.status(200).json({
      success: true,
      deliveryStatus: "sent",
      message: "Credentials sent successfully",
      phone: owner.phone,
    });
  } catch (error) {
    const safeMsg = error?.safeMessage || error?.message || "WhatsApp delivery failed";
    const errorType = error?.errorType || "META_DELIVERY_FAILED";
    const appStatus = error?.statusCode || 502;

    try {
      const ownerId = req.params.ownerId || req.params.id;
      let owner = await Owner.findById(ownerId);
      if (!owner && mongoose.Types.ObjectId.isValid(ownerId)) {
        owner = await Owner.findOne({ hostelId: ownerId });
      }
      if (owner) {
        owner.credentialDeliveryStatus = "failed";
        owner.lastDeliveryError = safeMsg;
        await owner.save();
      }
    } catch (saveErr) {
      console.error("Failed to update owner delivery error status:", saveErr?.message || saveErr);
    }

    return res.status(appStatus).json({
      success: false,
      deliveryStatus: "failed",
      errorType,
      message: safeMsg,
      error: safeMsg,
    });
  }
};

const resendWhatsApp = sendCredentials;

// ==========================
// RESET OWNER TEMP PASSWORD
// (GENERATES NEW TEMP PASSWORD, HASHES IT, RETURNS ONCE TO ADMIN)
// ==========================
const resetOwnerTempPassword = async (req, res) => {
  try {
    const ownerId = req.params.ownerId || req.params.id;
    let owner = await Owner.findById(ownerId);
    if (!owner && mongoose.Types.ObjectId.isValid(ownerId)) {
      owner = await Owner.findOne({ hostelId: ownerId });
    }
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const newTempPassword = "Temp@" + Math.floor(1000 + Math.random() * 9000);

    const bcryptjs = require("bcryptjs");
    const hashedPassword = await bcryptjs.hash(newTempPassword, 10);

    owner.password = hashedPassword;
    owner.mustChangePassword = true;
    owner.firstLogin = true;
    owner.passwordChanged = false;
    owner.credentialIssuedAt = new Date();
    owner.credentialDeliveryStatus = "issued";
    await owner.save();

    // Invalidate all active sessions for this owner upon password reset
    const OwnerSession = require("../models/OwnerSession");
    await OwnerSession.updateMany(
      { ownerId: owner._id, isRevoked: false },
      { $set: { isRevoked: true } }
    );

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      hostelId: owner.hostelId,
      action: "RESET_OWNER_PASSWORD",
      actionType: "UPDATE",
      entity: "Owner",
      targetId: owner._id,
      details: {
        ownerName: owner.ownerName || owner.name,
        phone: owner.phone,
        message: `Reset temporary password for owner ${owner.ownerName || owner.name}`
      },
      timestamp: new Date()
    }).catch(() => {});

    const frontendBase = process.env.FRONTEND_URL || process.env.VITE_APP_URL || process.env.PUBLIC_URL || (req.headers && req.headers.origin ? req.headers.origin : "https://hostelmate-saas.vercel.app");
    const loginUrl = `${String(frontendBase).replace(/\/$/, "")}/owner/login`;

    return res.status(200).json({
      success: true,
      message: "Temporary password reset successfully",
      owner: {
        id: owner._id,
        fullName: owner.ownerName,
        phone: owner.phone,
        email: owner.email,
      },
      credentials: {
        loginUrl,
        tempPassword: newTempPassword,
        temporaryPassword: newTempPassword,
        username: owner.phone,
        issuedAt: owner.credentialIssuedAt,
      },
      credentialDelivery: {
        status: owner.credentialDeliveryStatus,
      },
      loginUrl,
      credentialStatus: "issued",
      ownerId: owner._id,
    });
  } catch (error) {
    console.error("resetOwnerTempPassword error:", error?.message || error);
    return res.status(500).json({ success: false, message: "Failed to reset password", error: error?.message || String(error) });
  }
};


// ==========================
// DELETE HOSTEL
// ==========================

// ==========================
// HOSTEL DELETION & TRASH SYSTEM (60-DAY RETENTION)
// ==========================

const deleteHostel = async (req, res) => {
  try {
    const hostelId = req.params.id;

    if (!hostelId || !mongoose.Types.ObjectId.isValid(hostelId)) {
      return res.status(400).json({ success: false, message: "Invalid hostel ID format" });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (hostel.isDeleted) {
      return res.status(400).json({ success: false, message: "Hostel is already in Trash" });
    }

    // Soft-delete hostel document.
    // CRITICAL: Financial, payment, and subscription history MUST NEVER be deleted!
    hostel.isDeleted = true;
    hostel.deletedAt = new Date();
    hostel.deletedBy = req.admin?._id || req.user?._id || null;
    hostel.deleteReason = req.body?.reason || "Admin deletion";
    await hostel.save();

    return res.status(200).json({
      success: true,
      message: "Hostel moved to Trash. Retained for 60 days. All financial & payment records preserved.",
      hostelId: hostel._id,
      retentionDays: 60,
    });
  } catch (error) {
    console.error("deleteHostel error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete hostel", error: error?.message || String(error) });
  }
};

const getTrashHostels = async (req, res) => {
  try {
    const trashHostels = await Hostel.find({ isDeleted: true }).sort({ deletedAt: -1 }).lean();
    const now = Date.now();

    const formatted = await Promise.all(
      trashHostels.map(async (h) => {
        const deletedAtTime = h.deletedAt ? new Date(h.deletedAt).getTime() : now;
        const elapsedMs = Math.max(0, now - deletedAtTime);
        const daysElapsed = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.max(0, 60 - daysElapsed);

        let deletedByName = "SuperAdmin";
        if (h.deletedBy && mongoose.Types.ObjectId.isValid(h.deletedBy)) {
          const Admin = require("../models/Admin");
          const adminUser = await Admin.findById(h.deletedBy).select("fullName username role").lean();
          if (adminUser) deletedByName = adminUser.fullName || adminUser.username || "SuperAdmin";
        }

        // Fetch preserved owner & financial stats indicator
        const owner = await Owner.findOne({ hostelId: h._id }).select("ownerName phone email").lean();
        const paymentCount = await Payment.countDocuments({ hostelId: h._id });
        const subscription = await Subscription.findOne({ hostelId: h._id }).select("planType status amount").lean();

        return {
          _id: h._id,
          hostelName: h.hostelName || h.name || "Unnamed Hostel",
          ownerName: owner?.ownerName || h.ownerName || "Not provided",
          ownerPhone: owner?.phone || h.phone || "-",
          ownerEmail: owner?.email || h.email || "-",
          deletedAt: h.deletedAt,
          deletedBy: deletedByName,
          deleteReason: h.deleteReason || "Admin request",
          daysRemaining,
          retentionPeriodDays: 60,
          financialRecordsPreserved: true,
          paymentCount,
          subscriptionStatus: subscription?.status || h.subscriptionStatus || "preserved",
          planType: subscription?.planType || h.planType || "preserved",
        };
      })
    );

    return res.status(200).json({ success: true, hostels: formatted, count: formatted.length });
  } catch (error) {
    console.error("getTrashHostels error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch trash hostels", error: error?.message });
  }
};

const getTrashHostelById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid hostel ID format" });
    }

    const hostel = await Hostel.findOne({ _id: id, isDeleted: true }).lean();
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found in Trash" });
    }

    const now = Date.now();
    const deletedAtTime = hostel.deletedAt ? new Date(hostel.deletedAt).getTime() : now;
    const daysElapsed = Math.floor(Math.max(0, now - deletedAtTime) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, 60 - daysElapsed);

    const owner = await Owner.findOne({ hostelId: id }).lean();
    const payments = await Payment.find({ hostelId: id }).lean();

    return res.status(200).json({
      success: true,
      hostel: {
        ...hostel,
        owner,
        paymentsCount: payments.length,
        daysRemaining,
        retentionDays: 60,
      },
    });
  } catch (error) {
    console.error("getTrashHostelById error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch trash hostel details" });
  }
};

const restoreHostelFromTrash = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid hostel ID format" });
    }

    const hostel = await Hostel.findById(id);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    if (!hostel.isDeleted) {
      return res.status(400).json({ success: false, message: "Hostel is not in trash" });
    }

    // Restore to active status
    hostel.isDeleted = false;
    hostel.deletedAt = null;
    hostel.deletedBy = null;
    hostel.deleteReason = "";
    await hostel.save();

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      hostelId: hostel._id,
      action: "RESTORE_HOSTEL",
      actionType: "RESTORE",
      entity: "Hostel",
      targetId: hostel._id,
      details: {
        hostelName: hostel.hostelName || hostel.name,
        message: `Restored hostel ${hostel.hostelName || hostel.name} from Trash`
      },
      timestamp: new Date()
    }).catch(() => {});

    return res.status(200).json({
      success: true,
      message: "Hostel restored successfully to active registry",
      hostel,
    });
  } catch (error) {
    console.error("restoreHostelFromTrash error:", error);
    return res.status(500).json({ success: false, message: "Failed to restore hostel", error: error?.message });
  }
};

const permanentDeleteHostelFromTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmHostelName } = req.body || {};

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid hostel ID format" });
    }

    const hostel = await Hostel.findOne({ _id: id, isDeleted: true });
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found in Trash" });
    }

    const expectedName = (hostel.hostelName || hostel.name || "").trim();
    if (!confirmHostelName || String(confirmHostelName).trim() !== expectedName) {
      return res.status(400).json({
        success: false,
        message: `Confirmation failed. Please enter exact hostel name: "${expectedName}"`,
      });
    }

    // Elevate authorization check: Admin / SuperAdmin role required
    const currentAdmin = req.user || req.admin;
    const adminRole = currentAdmin?.role;
    if (!adminRole || !["super_admin", "admin"].includes(adminRole)) {
      return res.status(403).json({ success: false, message: "Elevated administrator authorization required for permanent purge" });
    }

    // DO NOT DELETE PAYMENT OR SUBSCRIPTION FINANCIAL RECORDS!
    // Permanently remove the Hostel document only.
    await Hostel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Hostel document permanently purged from Trash. Payment & financial accounting records remain preserved.",
    });
  } catch (error) {
    console.error("permanentDeleteHostelFromTrash error:", error);
    return res.status(500).json({ success: false, message: "Failed to purge hostel", error: error?.message });
  }
};


// ==========================
// UPDATE SUBSCRIPTION
// ==========================

const updateSubscription =
  async (req, res) => {
    try {

      const {
        planType,
        subscriptionStatus,
        isFreeAccess,
        residentLimit,
        amount,
        subscriptionEndDate,
      } = req.body;

      const subscription =
        await Subscription.findByIdAndUpdate(

          req.params.id,

          {
            planType,
            subscriptionStatus,
            isFreeAccess,
            residentLimit,
            amount,
            subscriptionEndDate,
          },

          { returnDocument: "after" }
        );

      res.status(200).json({
        success: true,

        message:
          "Subscription Updated",

        subscription,
      });

    } catch (error) {

      res.status(500).json({ success: false, message: "Failed to update subscription", error: error?.message || String(error) });

    }
  };


// ==========================
// GET SUBSCRIPTIONS
// ==========================

const getSubscriptions =
  async (req, res) => {
    try {
      const subscriptions =
        await Subscription.find().populate(
          "hostelId"
        );

      res.status(200).json({
        success: true,
        subscriptions,
      });
    } catch (error) {
      res.status(500).json(error);
    }
  };

// ==========================
// GET SUBSCRIPTIONS (ADMIN LISTING)
// GET /api/admin/subscriptions
// ==========================
const getAdminSubscriptions = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 25,
      search = "",
      sortField = "createdAt",
      sortOrder = "desc",
      status,
      plan,
      expiry,
    } = req.query || {};

    const pageNum = Number.isFinite(parseInt(page, 10)) ? parseInt(page, 10) : 1;
    const sizeNum = Number.isFinite(parseInt(pageSize, 10)) ? parseInt(pageSize, 10) : 25;
    const skip = (pageNum - 1) * sizeNum;

    const safeSortField = ["createdAt", "updatedAt", "subscriptionEndDate"].includes(sortField)
      ? sortField
      : "createdAt";
    const safeSortOrder = String(sortOrder).toLowerCase() === "asc" ? 1 : -1;

    const match = {};
    if (status) match.subscriptionStatus = status;
    if (plan) match.planType = plan;

    if (expiry) {
      // expiry supports exact-date or prefix (YYYY-MM) best-effort
      const expiryStr = String(expiry);
      match.subscriptionEndDate = {
        $gte: new Date(expiryStr),
        $lt: new Date(`${expiryStr}T23:59:59.999Z`),
      };
    }

    if (search) {
      // Best-effort search across subscription fields.
      // Hostel search is done after $lookup.
      match.$or = [
        { planType: { $regex: search, $options: "i" } },
        { subscriptionStatus: { $regex: search, $options: "i" } },
        { transactionId: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "hostels",
          localField: "hostelId",
          foreignField: "_id",
          as: "hostel",
        },
      },
      { $unwind: { path: "$hostel", preserveNullAndEmptyArrays: true } },
      ...(search
        ? [
            {
              $match: {
                $or: [
                  { "hostel.hostelName": { $regex: search, $options: "i" } },
                  { "hostel.ownerName": { $regex: search, $options: "i" } },
                ],
              },
            },
          ]
        : []),
      {
        $addFields: {
          daysRemaining: {
            $cond: {
              if: { $ifNull: ["$subscriptionEndDate", false] },
              then: {
                $floor: {
                  $dateDiff: {
                    startDate: "$$NOW",
                    endDate: "$subscriptionEndDate",
                    unit: "day",
                  },
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          subscriptionId: "$_id",
          hostelId: "$hostelId",
          hostelName: "$hostel.hostelName",
          ownerName: "$hostel.ownerName",
          planType: "$planType",
          amount: "$amount",
          subscriptionStatus: "$subscriptionStatus",
          subscriptionStartDate: "$subscriptionStartDate",
          subscriptionEndDate: "$subscriptionEndDate",
          residentLimit: "$residentLimit",
          currentResidentCount: "$currentResidentCount",
          isTrial: "$isTrial",
          isFreeAccess: "$isFreeAccess",
          paymentMethod: "$paymentMethod",
          transactionId: "$transactionId",
          createdAt: "$createdAt",
          updatedAt: "$updatedAt",
          daysRemaining: 1,
        },
      },
      { $sort: { [safeSortField]: safeSortOrder } },
      {
        $facet: {
          data: [
            { $skip: skip },
            { $limit: sizeNum },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];

    const [result] = await Subscription.aggregate(pipeline);

    const data = result?.data || [];
    const total = result?.total?.[0]?.count || 0;

    res.status(200).json({
      success: true,
      data,
      pagination: {
        total,
        page: pageNum,
        pageSize: sizeNum,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to load subscriptions", error: error?.message || String(error) });
  }
};


// ==========================
// ADD HOSTEL (SUPERADMIN)
// ==========================
const addHostel = async (req, res) => {
  try {
    const {
      hostelName,
      ownerName,
      phone,
      ownerAddress,
      hostelAddress,
      state,
      district,
      city,
      pincode,
      hostelType,
      subscription,
    } = req.body;

    if (!hostelName || !ownerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "hostelName, ownerName, phone are required",
      });
    }

    const existingOwner = await Owner.findOne({ phone });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "An owner with this phone number already exists",
      });
    }

    const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
    const aadhaarFileName = getUploadedFileUrl(req.files?.aadhaarFile?.[0]) || req.files?.aadhaarFile?.[0]?.filename;
    const ownerPhotoFileName = getUploadedFileUrl(req.files?.ownerPhoto?.[0]) || req.files?.ownerPhoto?.[0]?.filename;
    const licensePhotoFileName = getUploadedFileUrl(req.files?.licensePhoto?.[0]) || req.files?.licensePhoto?.[0]?.filename;

    const { approveHostelRegistration } = require("../services/onboardingService");
    const result = await approveHostelRegistration({
      hostelName,
      ownerName,
      email: req.body.email || "",
      phone,
      city,
      address: hostelAddress,
      coverImage: ownerPhotoFileName,
      logo: "",
      aadhaarFile: aadhaarFileName,
      licensePhoto: licensePhotoFileName
    });

    const subPayload =
      typeof subscription === "string"
        ? JSON.parse(subscription)
        : subscription || {};

    const subscriptionDoc = await Subscription.create({
      hostelId: result.hostel._id,
      planType: subPayload.planType || "Basic",
      subscriptionStatus: subPayload.subscriptionStatus || "trial",
      isTrial: subPayload.isTrial ?? true,
      trialStartDate: subPayload.trialStartDate,
      trialEndDate: subPayload.trialEndDate,
      subscriptionStartDate: subPayload.subscriptionStartDate,
      subscriptionEndDate: subPayload.subscriptionEndDate,
      residentLimit: Number(subPayload.residentLimit ?? 60),
      isFreeAccess: Boolean(subPayload.isFreeAccess),
      amount: Number(subPayload.amount ?? 0),
      paymentMethod: subPayload.paymentMethod,
      approvedBy: req.user?.id || undefined,
    });

    return res.status(201).json({
      success: true,
      message: "Hostel added successfully",
      hostel: result.hostel,
      ownerId: result.owner?._id,
      subscription: subscriptionDoc,
      publicCode: result.hostel.publicCode || result.publicCode,
      publicUrl: result.publicUrl || result.publicLink,
      qrCodeUrl: result.qrCodeUrl || result.qrCode,
      qrCodeFullUrl: result.qrCodeUrl || result.qrCode,
      uniqueCode: result.hostel.publicCode || result.publicCode || result.hostel.slug,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Failed to add hostel",
      error: error?.message || error,
    });
  }
};

const Admin = require("../models/Admin");

// ==========================
// GET ADMIN PROFILE
// ==========================
const getAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId;
    
    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin not authenticated",
      });
    }

    const admin = await Admin.findById(adminId).select("-password");
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin,
    });
  } catch (error) {
    console.error("Get Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================
// UPDATE ADMIN PROFILE
// ==========================
const updateAdminProfile = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId;
    const { fullName, email, phone, profileImage } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin not authenticated",
      });
    }

    // Check for duplicate email (if being updated)
    if (email) {
      const existingAdmin = await Admin.findOne({ 
        email, 
        _id: { $ne: adminId } 
      });
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (profileImage) updateData.profileImage = profileImage;
    updateData.updatedAt = new Date();

    const admin = await Admin.findByIdAndUpdate(
      adminId,
      updateData,
      { returnDocument: "after", runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      admin,
    });
  } catch (error) {
    console.error("Update Admin Profile Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================
// CHANGE ADMIN PASSWORD
// ==========================
// ==========================
// EDIT HOSTEL LOCATION (ADMIN)
// ==========================
const editHostelLocation = async (req, res) => {
  try {
    const hostelId = req.params.id;
    const {
      hostelName,
      state,
      district,
      city,
      pincode,
      address,
      description,
      hostelType,
    } = req.body;

    if (!hostelId) {
      return res.status(400).json({ success: false, message: "Hostel id is required" });
    }

    if (!state || !district || !pincode) {
      return res.status(400).json({ success: false, message: "state, district, and pincode are required" });
    }

    const safePincode = String(pincode);
    if (!/^\d{6}$/.test(safePincode)) {
      return res.status(400).json({ success: false, message: "Pincode must be exactly 6 digits" });
    }

    const updateData = {
      ...(hostelName !== undefined ? { hostelName } : {}),
      state,
      district,
      city: city || "",
      pincode: safePincode,
      ...(address !== undefined ? { address } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(hostelType !== undefined ? { hostelType } : {}),
    };

    const updated = await Hostel.findByIdAndUpdate(hostelId, updateData, { returnDocument: "after", runValidators: true }).lean();

    if (!updated) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    return res.status(200).json({ success: true, message: "Hostel updated successfully", hostel: updated });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to update hostel", error: error?.message || String(error) });
  }
};

// ==========================
// CHANGE ADMIN PASSWORD
// ==========================
const changeAdminPassword = async (req, res) => {
  try {
    const adminId = req.user?.id || req.userId;
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: "Admin not authenticated",
      });
    }

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New passwords do not match",
      });
    }

    // Validate password strength
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const admin = await Admin.findById(adminId);
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Check old password
    const bcryptjs = require("bcryptjs");
    const isPasswordCorrect = await bcryptjs.compare(oldPassword, admin.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(newPassword, salt);

    admin.password = hashedPassword;
    admin.updatedAt = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change Admin Password Error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ==========================
// Module.exports
// ==========================
// ==========================
// SYSTEM HEALTH
// ==========================

const getSystemHealth = async (req, res) => {
  try {
    const stats = await mongoose.connection.db.stats();

    const mb2 = (bytesOrNumber) => {
      const n = Number(bytesOrNumber ?? 0);
      if (!Number.isFinite(n)) return "0";
      return (n / (1024 * 1024)).toFixed(2);
    };

    const dataSizeMB = mb2(stats?.dataSize);
    const storageSizeMB = mb2(stats?.storageSize);

    const [totalHostels, totalOwners, totalResidents, totalRooms, totalPayments] =
      await Promise.all([
        Hostel.countDocuments(),
        Owner.countDocuments(),
        Resident.countDocuments(),
        Room.countDocuments(),
        Payment.countDocuments(),
      ]);

    res.status(200).json({
      dataSizeMB,
      storageSizeMB,
      collections: stats?.collections ?? 0,
      objects: stats?.objects ?? 0,
      totalHostels,
      totalOwners,
      totalResidents,
      totalRooms,
      totalPayments,
    });
  } catch (error) {
    console.error("getSystemHealth error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to load system health",
      error: error?.message || String(error),
    });
  }
};

// ==========================
// Module.exports
// ==========================
// ==========================
// Phase 4.1: Dashboard 3.0 endpoints (thin controllers)
// ==========================
const { getDashboardOverview } = require("../services/dashboard/overviewService");
const { getRevenueMetrics: getDashboardRevenue } = require("../services/dashboard/revenueService");
const { getMonitoring: getDashboardMonitoring } = require("../services/dashboard/monitoringService");

const getDashboardOverviewHandler = async (req, res) => {
  try {
    const data = await getDashboardOverview();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard overview",
      error: error?.message || String(error),
    });
  }
};

const getDashboardRevenueHandler = async (req, res) => {
  try {
    const data = await getDashboardRevenue();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard revenue",
      error: error?.message || String(error),
    });
  }
};


const getDashboardMonitoringHandler = async (req, res) => {
  try {
    const data = await getDashboardMonitoring();
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load dashboard monitoring", error: error?.message || String(error) });
  }
};

// ==========================
// WHATSAPP DIAGNOSTICS & TESTING
// ==========================
const getWhatsAppDiagnostics = async (req, res) => {
  try {
    const { validateWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");
    const config = validateWhatsAppConfig();

    return res.status(200).json({
      success: true,
      configured: config.isConfigured,
      hasToken: config.hasToken,
      hasPhoneNumberId: config.hasPhoneNumberId,
      hasApiVersion: config.hasApiVersion,
      phoneNumberIdConfigured: config.hasPhoneNumberId,
      tokenConfigured: config.hasToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve WhatsApp diagnostics",
    });
  }
};

const testWhatsAppConfig = async (req, res) => {
  try {
    const { verifyMetaWhatsAppConfig } = require("../utils/sendOwnerWhatsApp");
    const result = await verifyMetaWhatsAppConfig();
    const statusCode = result.success ? 200 : 502;

    return res.status(statusCode).json({
      success: result.success,
      verified: result.verified,
      configured: result.configured,
      status: result.status,
      errorType: result.errorType,
      deliveryStatus: result.deliveryStatus || (result.success ? "verified" : "failed"),
      message: result.message,
    });
  } catch (error) {
    return res.status(502).json({
      success: false,
      verified: false,
      errorType: "META_AUTHENTICATION",
      deliveryStatus: "failed",
      status: "Verification Failed",
      message: error?.message || "WhatsApp configuration test failed",
    });
  }
};

// Hostels CRM (Phase 4.2A)
const hostelAdminController = require("./hostelAdminController");

module.exports = {
  getDashboardStats,
  getAllRequests,
  approveHostel,
  rejectRequest,
  getAllHostels,
  getPendingHostels,
  deleteHostel,
  updateSubscription,
  getSubscriptions,
  addHostel,
  editHostelLocation,
  sendCredentials,
  resendWhatsApp,
  resetOwnerTempPassword,
  getWhatsAppDiagnostics,
  testWhatsAppConfig,
  getAdminProfile,
  updateAdminProfile,
  finalizeHostelActivation,
  changeAdminPassword,
  getSystemHealth,

  getDashboardOverview: getDashboardOverviewHandler,
  getDashboardRevenue: getDashboardRevenueHandler,
  getDashboardMonitoring: getDashboardMonitoringHandler,

  // Admin subscriptions listing
  getAdminSubscriptions,

  // 60-Day Trash Management
  getTrashHostels,
  getTrashHostelById,
  restoreHostelFromTrash,
  permanentDeleteHostelFromTrash,

// Phase 4.2A exports
  getHostels: hostelAdminController.getHostels,
  getHostelById: hostelAdminController.getHostel,
  getHostelOwner: hostelAdminController.getOwner,
};

// ==========================
// OWNERS CRM & RESIDENTS ROLL
// ==========================

const maskAadhaar = (val) => {
  if (!val) return "";
  const cleaned = String(val).replace(/\s+/g, "");
  if (cleaned.length < 4) return "****";
  return `XXXX XXXX ${cleaned.slice(-4)}`;
};

const getAllOwnersList = async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      page = 1,
      limit = 50,
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query || {};

    // 1. Identify Trashed and Active Hostels for Server-Side Relationship Consistency
    const trashedHostels = await Hostel.find({ isDeleted: true }).select("_id phone").lean();
    const trashedHostelIds = trashedHostels.map((h) => h._id);

    const activeHostels = await Hostel.find({
      isDeleted: { $ne: true },
      pendingActivation: { $ne: true },
    }).select("_id phone").lean();
    const activeHostelIds = activeHostels.map((h) => h._id);
    const activeHostelPhones = activeHostels.map((h) => h.phone).filter(Boolean);

    const trashedOwnerCondition = trashedHostelIds.length > 0 ? {
      $or: [
        { hostelId: { $in: trashedHostelIds } },
        { activeHostelId: { $in: trashedHostelIds } },
      ],
    } : null;

    const activeHostelOwnerCondition = {
      $or: [
        { hostelId: { $in: activeHostelIds } },
        { activeHostelId: { $in: activeHostelIds } },
        { phone: { $in: activeHostelPhones } },
      ],
    };

    const queryConditions = [];

    const rawStatus = String(status || "").trim().toLowerCase();
    if (rawStatus === "active") {
      queryConditions.push({ status: "active" });
      queryConditions.push(activeHostelOwnerCondition);
    } else if (rawStatus === "suspended") {
      queryConditions.push({ status: "suspended" });
      if (trashedOwnerCondition) queryConditions.push({ $nor: [trashedOwnerCondition] });
    } else if (rawStatus === "disabled") {
      queryConditions.push({ status: "disabled" });
      if (trashedOwnerCondition) queryConditions.push({ $nor: [trashedOwnerCondition] });
    } else if (rawStatus === "trash" || rawStatus === "trashed" || rawStatus === "archived") {
      if (trashedOwnerCondition) {
        queryConditions.push(trashedOwnerCondition);
      } else {
        queryConditions.push({ _id: null });
      }
    } else {
      // Default / "all": exclude owners linked to trashed hostels from normal active CRM
      if (trashedOwnerCondition) {
        queryConditions.push({ $nor: [trashedOwnerCondition] });
      }
    }

    const trimmedSearch = String(search || "").trim();
    if (trimmedSearch) {
      const searchRegex = new RegExp(trimmedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingHostels = await Hostel.find({
        $or: [
          { hostelName: searchRegex },
          { name: searchRegex },
          { city: searchRegex },
          { district: searchRegex },
          { state: searchRegex },
          { publicCode: searchRegex },
          { uniqueCode: searchRegex },
        ],
      }).select("_id").lean();
      const matchingHostelIds = matchingHostels.map((h) => h._id);

      queryConditions.push({
        $or: [
          { ownerName: searchRegex },
          { phone: searchRegex },
          { email: searchRegex },
          { username: searchRegex },
          { hostelId: { $in: matchingHostelIds } },
          { activeHostelId: { $in: matchingHostelIds } },
        ],
      });
    }

    const finalQuery = queryConditions.length > 1 ? { $and: queryConditions } : (queryConditions[0] || {});

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await Owner.countDocuments(finalQuery);
    const owners = await Owner.find(finalQuery)
      .sort({ [sortField]: sortOrder === "asc" ? 1 : -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const data = await Promise.all(
      owners.map(async (o) => {
        const targetHostelId = o.activeHostelId || o.hostelId;
        let hostel = null;
        if (targetHostelId) {
          hostel = await Hostel.findById(targetHostelId).lean();
        }
        if (!hostel && o.phone) {
          hostel = await Hostel.findOne({ phone: o.phone, isDeleted: false }).lean();
        }

        const hostelRequest = o.phone ? await HostelRequest.findOne({ phone: o.phone }).lean() : null;

        let sub = null;
        let daysRemaining = 0;
        let residentCount = 0;
        let roomsCount = 0;
        let totalBeds = 0;
        let occupiedBeds = 0;
        let occupancyPercent = 0;
        let monthlyRevenue = 0;

        if (hostel?._id) {
          sub = await Subscription.findOne({ hostelId: hostel._id }).lean();
          if (sub && sub.subscriptionEndDate) {
            const diff = new Date(sub.subscriptionEndDate) - new Date();
            daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
          }

          residentCount = await Resident.countDocuments({ hostelId: hostel._id, status: "active" });
          const rooms = await Room.find({ hostelId: hostel._id }).lean();
          roomsCount = rooms.length;
          rooms.forEach((r) => {
            totalBeds += Number(r.totalBeds || 0);
            occupiedBeds += Number(r.occupiedBeds || 0);
          });
          if (totalBeds > 0) {
            occupancyPercent = Math.round((occupiedBeds / totalBeds) * 100);
          }

          const payments = await Payment.aggregate([
            { $match: { hostelId: hostel._id, status: { $in: ["Paid", "paid", "success"] } } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]);
          if (payments.length > 0) {
            monthlyRevenue = payments[0].total || 0;
          }
        }

        const ownerName = o.ownerName || hostel?.ownerName || hostelRequest?.ownerName || "Not provided";
        const phone = o.phone || hostel?.phone || hostelRequest?.phone || "Not provided";
        const email = o.email || hostel?.email || hostelRequest?.email || "";
        const photo = o.profileImage || hostel?.ownerPhoto || hostelRequest?.ownerPhoto || "";

        const maskedAadhaarNum = hostelRequest?.idNumber ? maskAadhaar(hostelRequest.idNumber) : "";
        const idStatus = (hostelRequest?.aadhaarFile || hostelRequest?.idNumber) ? "Uploaded / Available" : "Not provided";

        const hostelName = hostel?.hostelName || hostel?.name || "N/A";
        const address = hostel?.address || hostelRequest?.ownerAddress || hostelRequest?.hostelAddress || "Not provided";
        const city = hostel?.city || hostelRequest?.city || "";
        const district = hostel?.district || hostelRequest?.district || "";
        const state = hostel?.state || hostelRequest?.state || "";
        const pincode = hostel?.pincode || hostelRequest?.pincode || "";
        const hostelType = hostel?.hostelType || hostelRequest?.hostelType || "Standard";
        const plan = sub?.planType || hostel?.planType || "Basic";
        const subscriptionStatus = sub?.subscriptionStatus || hostel?.subscriptionStatus || (hostel ? "active" : "N/A");
        const publicCode = hostel?.publicCode || hostel?.uniqueCode || hostel?.slug || "";
        const uniqueCode = publicCode;
        const publicUrl = hostel?.publicUrl || "";
        const qrCodeUrl = hostel?.qrCodeUrl || "";

        // Status derivation taking linked hostel lifecycle into account
        let effectiveStatus = o.status || "active";
        let isHostelInTrash = false;
        let trashDaysRemaining = 0;

        if (hostel?.isDeleted) {
          effectiveStatus = "Hostel in Trash";
          isHostelInTrash = true;
          trashDaysRemaining = Math.max(0, 60 - Math.floor((Date.now() - new Date(hostel.deletedAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
        } else if (hostel?.pendingActivation) {
          effectiveStatus = "Hostel Pending Activation";
        } else if (!hostel) {
          effectiveStatus = "No Hostel Linked";
        }

        return {
          id: o._id,
          _id: o._id,
          name: ownerName,
          ownerName: ownerName,
          phone: phone,
          email: email,
          photo: photo,
          profileImage: photo,
          status: effectiveStatus,
          effectiveStatus: effectiveStatus,
          rawStatus: o.status || "active",
          isHostelInTrash: isHostelInTrash,
          trashDaysRemaining: trashDaysRemaining,
          role: o.role || "owner",
          createdAt: o.createdAt,
          mustChangePassword: !!o.mustChangePassword,
          firstLogin: !!o.firstLogin,
          passwordChanged: !!o.passwordChanged,
          credentialIssuedAt: o.credentialIssuedAt,
          credentialDeliveryStatus: o.credentialDeliveryStatus || "not_issued",
          lastDeliveryError: o.lastDeliveryError || null,

          // Identity Details
          identity: {
            idType: hostelRequest?.idType || "Aadhaar",
            idNumber: maskedAadhaarNum,
            status: idStatus,
            aadhaarFile: hostelRequest?.aadhaarFile || "",
            licensePhoto: hostelRequest?.licensePhoto || "",
          },

          // Geographic / Address
          address: address,
          city: city,
          district: district,
          state: state,
          pincode: pincode,

          // Linked Hostel
          hostel: hostelName,
          hostelName: hostelName,
          hostelId: hostel?._id || null,
          hostelDetails: {
            hostelId: hostel?._id || null,
            hostelName: hostelName,
            address: address,
            city: city,
            district: district,
            state: state,
            pincode: pincode,
            hostelType: hostelType,
            roomsCount: roomsCount,
            residentCount: residentCount,
            occupancyPercent: occupancyPercent,
            planType: plan,
            subscriptionStatus: subscriptionStatus,
            daysRemaining: daysRemaining,
            monthlyRevenue: monthlyRevenue,
            storageUsage: residentCount > 0 ? `${(residentCount * 0.05 + 0.1).toFixed(1)} GB` : "0.1 GB",
            publicCode: publicCode,
            uniqueCode: uniqueCode,
            publicUrl: publicUrl,
            qrCodeUrl: qrCodeUrl,
            isDeleted: !!hostel?.isDeleted,
            deletedAt: hostel?.deletedAt || null,
          },

          // Operational metrics
          plan: plan,
          planName: plan,
          daysRemaining: daysRemaining,
          storageUsage: residentCount > 0 ? `${(residentCount * 0.05 + 0.1).toFixed(1)} GB` : "0.1 GB",
          residentCount: residentCount,
          occupancyPercent: occupancyPercent,
          monthlyRevenue: monthlyRevenue,
          subscriptionStatus: subscriptionStatus,
        };
      })
    );

    // Live counts agreeing across CRM and database
    const [activeCount, suspendedCount, disabledCount, totalAllOwners] = await Promise.all([
      Owner.countDocuments({ status: "active", ...activeHostelOwnerCondition }),
      Owner.countDocuments({ status: "suspended", ...(trashedOwnerCondition ? { $nor: [trashedOwnerCondition] } : {}) }),
      Owner.countDocuments({ status: "disabled", ...(trashedOwnerCondition ? { $nor: [trashedOwnerCondition] } : {}) }),
      Owner.countDocuments(trashedOwnerCondition ? { $nor: [trashedOwnerCondition] } : {}),
    ]);

    return res.status(200).json({
      success: true,
      data,
      owners: data,
      pagination: {
        total: totalCount,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum) || 1,
      },
      counts: {
        all: totalAllOwners,
        active: activeCount,
        suspended: suspendedCount,
        disabled: disabledCount,
      },
    });
  } catch (error) {
    console.error("getAllOwnersList error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch owners", error: error?.message });
  }
};

const getAllResidentsList = async (req, res) => {
  try {
    const residents = await Resident.find().populate("hostelId", "hostelName").select("name room phone hostelId");
    
    const data = residents.map(r => ({
      name: r.name,
      hostelName: r.hostelId ? r.hostelId.hostelName : "N/A",
      room: r.room || "N/A",
      phone: r.phone
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports.getAllOwnersList = getAllOwnersList;
module.exports.getAllResidentsList = getAllResidentsList;

// ==========================
// SUPER ADMIN MODULES
// ==========================

const getBusinessBI = async (req, res) => {
  try {
    const totalHostels = await Hostel.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const revenue = await Payment.aggregate([
      { $match: { status: "Paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalHostels,
        totalResidents,
        totalRevenue: revenue.length > 0 ? revenue[0].total : 0,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getCustomerSuccess = async (req, res) => {
  try {
    const activeHostels = await Hostel.countDocuments({ status: "active" });
    const inactiveHostels = await Hostel.countDocuments({ status: { $ne: "active" } });
    
    const trialToPaidConversion = 45;
    const retentionRate = 95;
    const renewalProbability = 80;
    const churnPrediction = 5;
    const dormantHostels = await Hostel.countDocuments({ status: "dormant" });

    res.status(200).json({
      success: true,
      data: {
        activeHostels,
        inactiveHostels,
        healthScore: 92,
        trialToPaidConversion,
        retentionRate,
        renewalProbability,
        churnPrediction,
        dormantHostels
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getCommunications = async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find().populate("hostel", "name").populate("createdBy", "ownerName").sort({ createdAt: -1 }).lean();
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getAuditTrails = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
    res.status(200).json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getSystemSettings = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        maintenanceMode: false,
        registrationOpen: true,
        defaultTrialDays: 14,
        platformFeePercentage: 2
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports.getBusinessBI = getBusinessBI;
module.exports.getCustomerSuccess = getCustomerSuccess;
module.exports.getCommunications = getCommunications;
module.exports.getSupportTickets = getSupportTickets;
module.exports.getAuditTrails = getAuditTrails;
module.exports.getSystemSettings = getSystemSettings;
module.exports.getAllOwnersList = getAllOwnersList;
module.exports.getAllResidentsList = getAllResidentsList;

const setOwnerStatus = async (req, res) => {
  try {
    const ownerId = req.params.id || req.params.ownerId;
    const { status } = req.body || {};
    if (!["active", "disabled", "suspended"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value. Allowed: active, disabled, suspended" });
    }
    const owner = await Owner.findByIdAndUpdate(ownerId, { status }, { returnDocument: "after" });
    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }
    if (["disabled", "suspended"].includes(status)) {
      const OwnerSession = require("../models/OwnerSession");
      await OwnerSession.updateMany({ ownerId: owner._id, isRevoked: false }, { $set: { isRevoked: true } }).catch(() => {});
    }

    await AuditLog.create({
      adminId: req.user?._id || req.admin?._id,
      hostelId: owner.hostelId,
      action: status === "suspended" ? "SUSPEND_OWNER" : "SET_OWNER_STATUS",
      actionType: "UPDATE",
      entity: "Owner",
      targetId: owner._id,
      details: {
        ownerName: owner.ownerName || owner.name,
        status,
        message: `Updated owner ${owner.ownerName || owner.name} status to ${status}`
      },
      timestamp: new Date()
    }).catch(() => {});

    return res.status(200).json({ success: true, message: `Owner status updated to ${status}`, owner });
  } catch (error) {
    console.error("setOwnerStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to update owner status", error: error?.message });
  }
};

const forceResetOwnerPassword = resetOwnerTempPassword;
const markCommunicationRead = async (req, res) => res.status(200).json({ success: true });
const deleteCommunication = async (req, res) => res.status(200).json({ success: true });
const generateReport = async (req, res) => res.status(200).json({ success: true });
const updateSystemSettings = async (req, res) => res.status(200).json({ success: true });
const bulkHostelAction = async (req, res) => res.status(200).json({ success: true });
const runBackup = async (req, res) => res.status(200).json({ success: true, backup: { backupId: 'mock', sizeBytes: 100 } });
const getBackups = async (req, res) => res.status(200).json({ success: true, data: [] });
const downloadBackup = async (req, res) => res.status(200).json({ success: true });
const impersonateOwner = async (req, res) => res.status(200).json({ success: true });

module.exports.deleteRequest = deleteRequest;
module.exports.setOwnerStatus = setOwnerStatus;
module.exports.forceResetOwnerPassword = forceResetOwnerPassword;
module.exports.markCommunicationRead = markCommunicationRead;
module.exports.deleteCommunication = deleteCommunication;
module.exports.generateReport = generateReport;
module.exports.updateSystemSettings = updateSystemSettings;
module.exports.bulkHostelAction = bulkHostelAction;
module.exports.runBackup = runBackup;
module.exports.getBackups = getBackups;
module.exports.downloadBackup = downloadBackup;
module.exports.impersonateOwner = impersonateOwner;
module.exports.getAdminsTeam = getAdminsTeam;
module.exports.assignRequest = assignRequest;

