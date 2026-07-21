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
        await Hostel.countDocuments();

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
// GET ALL REQUESTS
// ==========================

const getAllRequests =
  async (req, res) => {
    try {

      const requests =
        await HostelRequest.find().sort({
          createdAt: -1,
        });

      res.status(200).json({
        success: true,

        requests,
      });

    } catch (error) {

      res.status(500).json(error);

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

    request.status = "activated";
    request.hostelId = String(result.hostel._id);
    await request.save();

    // NOTIFICATION: Hostel request approved by admin
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Admin = require("../models/Admin");
      const superAdmins = await Admin.find({ role: { $in: ["super_admin", "admin"] } });
      
      for (const admin of superAdmins || []) {
        await publishNotification({
          userId: admin._id,
          type: "system_update",
          title: "Hostel Request Approved",
          message: `${result.hostel.name} - Activated`,
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
      requiresSubscriptionSetup: false,
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
    const { hostelId } = req.params;
    const { planType, amount, startDate, endDate, isTrial, isFreeAccess, notes } = req.body || {};

    if (!hostelId) {
      return res.status(400).json({ success: false, message: "hostelId is required" });
    }

    const hostel = await Hostel.findById(hostelId);
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Generate temp password and hash it
    const tempPassword = `HM${Math.floor(1000 + Math.random() * 9000)}@`;

    const bcryptjs = require("bcryptjs");
    const hashedPassword = await bcryptjs.hash(tempPassword, 10);

    // Owner: create ONLY here (activation boundary)
    console.log("Creating owner now...");
    // Derive owner fields from draft hostel (created in approveHostel)
    const ownerPayload = {
      hostelId: hostel._id,
      ownerName: hostel.ownerName,
      phone: hostel.phone,
      username: hostel.phone,
      password: hashedPassword,
      tempPassword,
      mustChangePassword: true,
      firstLogin: true,
      onboardingCompleted: false,
      passwordChanged: false,
      rulesConfigured: false,
      roomsConfigured: false,
      role: "owner",
      status: "active",
      profileImage: hostel.ownerPhoto || "",
    };

    // Avoid accidental double-activation (idempotency best-effort)
    if (hostel.pendingActivation === false) {
      return res.status(400).json({ success: false, message: "Hostel already activated" });
    }

    const existingOwner = await Owner.findOne({ hostelId: hostel._id });
    if (existingOwner) {
      return res.status(400).json({ success: false, message: "Hostel already activated" });
    }


    const createdOwner = await Owner.create(ownerPayload);
    console.log("Owner created:", createdOwner?.username || createdOwner?._id);

    // Subscription creation ONLY here (activation boundary)
    // Map frontend labels to schema enum Basic/Pro
    const normalizedPlanType = planType === "Pro" || planType === "Monthly" || planType === "Yearly" ? "Pro" : "Basic";

    const subscriptionDoc = await Subscription.create({
      hostelId: hostel._id,
      planType: normalizedPlanType,
      subscriptionStatus: isTrial ? "trial" : "active",
      isTrial: !!isTrial,
      trialStartDate: startDate ? new Date(startDate) : new Date(),
      trialEndDate: endDate ? new Date(endDate) : undefined,
      subscriptionStartDate: startDate ? new Date(startDate) : new Date(),
      subscriptionEndDate: endDate ? new Date(endDate) : undefined,
      residentLimit: 60,
      isFreeAccess: !!isFreeAccess,
      amount: Number(amount ?? 0),
      notes: notes || "",
    });

    // Update hostel activation gating + store subscription canonical fields
    hostel.pendingActivation = false;
    hostel.subscriptionStatus = subscriptionDoc.subscriptionStatus;
    hostel.planType = subscriptionDoc.planType;
    hostel.subscriptionStartDate = subscriptionDoc.subscriptionStartDate;
    hostel.subscriptionEndDate = subscriptionDoc.subscriptionEndDate;
    hostel.isFreeAccess = subscriptionDoc.isFreeAccess;
    hostel.isTrial = subscriptionDoc.isTrial;

    await hostel.save();

    // Update hostel request status -> activated (ONLY here finalizes activation)
    const relatedRequest = await HostelRequest.findOne({ phone: hostel.phone, hostelName: hostel.hostelName });
    if (relatedRequest) {
      relatedRequest.status = "activated";
      await relatedRequest.save();
      console.log("Hostel request activated:", relatedRequest._id);
    }


    // STEP 2: WhatsApp onboarding - provider-ready placeholder (must happen AFTER successful activation)
    try {
      const { sendOwnerOnboarding } = require("../utils/sendOwnerOnboarding");

      const loginUrl = process.env.PUBLIC_URL || process.env.LOGIN_URL || "https://hostelmate-saas.vercel.app/login";
      const apiVersion = process.env.WHATSAPP_API_VERSION || "v19.0";

      console.log("STARTING WHATSAPP ONBOARDING");
      console.log("owner phone:", hostel.phone);
      console.log("normalized phone should be:", hostel.phone && hostel.phone.replace(/^0+/, "")?.length === 10 ? `91${hostel.phone.replace(/^0+/, "")}` : "unknown");
      console.log("owner name:", hostel.ownerName);
      console.log("hostel name:", hostel.hostelName);
      console.log("WHATSAPP config present:", {
        hasToken: !!process.env.WHATSAPP_TOKEN,
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "missing",
        apiVersion,
      });

      await sendOwnerOnboarding({
        ownerName: hostel.ownerName,
        hostelName: hostel.hostelName,
        phone: hostel.phone,
        username: hostel.phone,
        tempPassword,
        planType: hostel.planType,
        expiryDate: hostel.subscriptionEndDate,
        qrUrl: hostel.qrCodeUrl || hostel.qrCodeUrl,
        loginUrl,
      });

      console.log("WHATSAPP SENT SUCCESS");
    } catch (e) {
      console.error("WHATSAPP SEND FAILED", e.response?.data || e.message);
    }

    return res.status(200).json({
      success: true,
      message: "Hostel activated successfully",
      credentials: {
        username: hostel.phone,
        tempPassword,
      },
    });
  } catch (error) {
    console.error("finalizeHostelActivation error:", error);
    return res.status(500).json({ success: false, message: "Failed to finalize activation", error: error?.message || String(error) });
  }
};


// ==========================
// REJECT REQUEST
// ==========================

const rejectRequest =
  async (req, res) => {
    try {

      const updated = await HostelRequest.findByIdAndUpdate(
        req.params.id,
        {
          status: "rejected",
        },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Request not found" });
      }

      res.status(200).json({
        success: true,

        message:
          "Request Rejected",
      });

    } catch (error) {

      res.status(500).json(error);

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
    const hostels = await Hostel.find({ pendingActivation: false }).lean();

    const safeHostels = (hostels || []).map((hostel) => ({
      ...hostel,
      uniqueCode: hostel.uniqueCode || "",
      publicUrl: hostel.publicUrl || "",
      qrCodeUrl: hostel.qrCodeUrl || "",
      subscriptionStatus: hostel.subscriptionStatus || "trial",
      planType: hostel.planType || "Basic",
      isPublic: hostel.isPublic === undefined ? true : hostel.isPublic,
    }));

    const result = [];

    for (const hostel of safeHostels) {
      // If activation is still pending, the Owner record does not exist yet.
      // Attach HostelRequest applicant details for a better admin experience.
      const owner = await Owner.findOne({ hostelId: hostel._id }).lean();

      const hostelRequest = hostel.pendingActivation === true
        ? await HostelRequest.findOne({ hostelId: hostel._id })
            .lean()
        : null;

      const subscription = await Subscription.findOne({ hostelId: hostel._id }).lean();

      const rooms = await Room.find({ hostelId: hostel._id }).lean();
      let totalBeds = 0;
      let occupiedBeds = 0;
      rooms.forEach((r) => {
        totalBeds += Number(r.totalBeds || 0);
        occupiedBeds += Number(r.occupiedBeds || 0);
      });

      const bedRecords = await Bed.find({ hostelId: hostel._id }).lean();
      const bedTotal = bedRecords.length;
      const bedOccupied = bedRecords.filter((b) => String(b.status).toLowerCase() === "occupied").length;
      if (!totalBeds && bedTotal) totalBeds = bedTotal;
      if (!occupiedBeds && bedOccupied) occupiedBeds = bedOccupied;

      const activeResidents = await Resident.countDocuments({ hostelId: hostel._id, status: "active" });
      const totalRooms = rooms.length;
      const vacantBeds = Math.max(0, totalBeds - occupiedBeds);

      result.push({
        ...hostel,
        hostelId: hostel._id,
        hostelRequest: hostel.pendingActivation === true
          ? {
              hostelName: hostelRequest?.hostelName || hostel.hostelName || "",
              ownerName: hostelRequest?.ownerName || hostel.ownerName || "",
              phone: hostelRequest?.phone || hostel.phone || "",
              hostelType: hostelRequest?.hostelType || hostel.hostelType || hostel.type || hostel.category || "",
              state: hostelRequest?.state || hostel.state || "",
              district: hostelRequest?.district || hostel.district || "",
              city: hostelRequest?.city || hostel.city || hostel.place || hostel.location || "",
              pincode: hostelRequest?.pincode || hostel.pincode || "",
            }
          : undefined,
        owner: {
          name: owner?.ownerName || hostel.hostelName || hostel.ownerName || "N/A",
          email: owner?.email || "",
          phone: owner?.phone || hostel.phone || "",
          username: owner?.username || owner?.phone || owner?.email || hostel.phone || "",
          profileImage: owner?.profileImage || "",
        },
        ownerId: owner?._id || undefined,
        phone: owner?.phone || hostel.phone || "",
        tempPassword: owner?.tempPassword || "Temp@123",
        hostelName: hostel.hostelName || "",
        hostelType: hostel.hostelType || hostel.type || hostel.category || "",
        address: hostel.address || "",
        district: hostel.district || "",
        city: hostel.city || hostel.place || hostel.location || "",
        pincode: hostel.pincode || "",
        description: hostel.description || "",
        createdAt: hostel.createdAt || null,
        approvalStatus: hostel.pendingActivation === true
          ? "activation_pending"
          : hostel.approvalStatus || hostel.status || "approved",
        subscriptionStatus:
          (subscription && subscription.subscriptionStatus) ||
          hostel.subscriptionStatus ||
          "trial",
        isTrial:
          subscription && subscription.isTrial !== undefined
            ? subscription.isTrial
            : (((subscription && subscription.subscriptionStatus) ||
                hostel.subscriptionStatus ||
                "trial") === "trial"),
        qrCode: hostel.qrCodeUrl || "",
        publicLink: hostel.publicUrl || "",
        qrCodeUrl: hostel.qrCodeUrl || "",
        publicUrl: hostel.publicUrl || "",
        totalRooms,
        totalBeds,
        occupiedBeds,
        vacantBeds,
        activeResidents,
        occupancy: { totalBeds, occupiedBeds, vacantBeds },
      });
    }

    res.status(200).json({ success: true, hostels: result });
  } catch (error) {
    console.error("Error fetching hostels:", error);
    res.status(500).json({ success: false, message: "Failed to fetch hostels" });
  }
};

// ==========================
// RESEND WHATSAPP (MOCK)
// ==========================
const resendWhatsApp = async (req, res) => {
  try {
    const { ownerId } = req.params;

    if (!ownerId) {
      return res.status(400).json({
        success: false,
        message: "Owner ID is required",
      });
    }

    const owner = await Owner.findById(ownerId).populate("hostelId");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const hostel = owner.hostelId;
    if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

    // Safety: tempPassword is cleared after onboarding/password change.
    // If missing/null/empty, do NOT send resend credentials (no Temp@123 fallback).
    if (!owner.tempPassword || !String(owner.tempPassword).trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Owner has already configured a custom password. Use Reset Temporary Password to generate new credentials.",
      });
    }

    const { generateResendWhatsAppURL } = require('../utils/messageService');
    const whatsappURL = generateResendWhatsAppURL(
      hostel.hostelName,
      owner.username || owner.phone,
      owner.tempPassword,
      hostel.publicUrl,
      owner.phone,
      owner.ownerName
    );

    // Call the message service to log
    const result = await sendApprovalMessages(
      owner.phone,
      owner.ownerName,
      hostel.hostelName,
      owner.username || owner.phone,
      owner.tempPassword,
      hostel.publicUrl
    );

    res.status(200).json({
      success: true,
      message: "WhatsApp link generated",
      whatsappURL: whatsappURL,
      phone: owner.phone
    });

  } catch (error) {
    console.error("ResendWhatsApp Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================
// RESET OWNER TEMP PASSWORD
// ==========================
const resetOwnerTempPassword = async (req, res) => {
  try {
    const { ownerId } = req.params;
    const owner = await Owner.findById(ownerId).populate("hostelId");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const newTempPassword = "Temp@" + Math.floor(1000 + Math.random() * 9000);

    // Store bcrypt hash in `password` (temporary password remains plaintext in `tempPassword`).
    // TODO(migration): remove plaintext login fallback after legacy owners are migrated.
    const bcryptjs = require("bcryptjs");
    const hashedPassword = await bcryptjs.hash(newTempPassword, 10);

    owner.password = hashedPassword;
    owner.tempPassword = newTempPassword;
    await owner.save();


    res.status(200).json({ success: true, message: "Password reset successfully", tempPassword: newTempPassword });
  } catch (error) {
    res.status(500).json(error);
  }
};


// ==========================
// DELETE HOSTEL
// ==========================

const deleteHostel = async (req, res) => {
  try {
    const hostelId = req.params.id;

    // Delete dependent graph to fully remove hostel data.
    // NOTE: order matters to avoid dangling refs.
    const [hostel] = await Hostel.find({ _id: hostelId }).limit(1).lean();
    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const roomIds = await Room.find({ hostelId }).distinct("_id");
    const bedIds = await Bed.find({ hostelId }).distinct("_id");

    // Beds -> set to vacant/clear refs (optional; then delete)
    await Bed.deleteMany({ hostelId });

    // Residents
    await Resident.deleteMany({ hostelId });

    // Rooms
    await Room.deleteMany({ hostelId });

    // Payments
    await Payment.deleteMany({ hostelId });

    // Public admission requests
    await PublicAdmission.deleteMany({ hostelId });

    // Complaints (if you later add a model, keep deletion here)
    // Notifications + device tokens
    await DeviceToken.deleteMany({ hostelId });
    await Notification.deleteMany({ hostelId });

    // Subscription
    await Subscription.deleteMany({ hostelId });

    // Staff (if model exists, add safely)

    // Finally hostel + owner
    const owner = await Owner.findOne({ hostelId });
    if (owner?._id) {
      await Owner.deleteOne({ _id: owner._id });
    }

    await Hostel.findByIdAndDelete(hostelId);

    // HostelRequest are global partner applications, delete only if you want.
    await HostelRequest.deleteMany({ phone: hostel.phone });

    res.status(200).json({ success: true, message: "Hostel Deleted" });
  } catch (error) {
    console.error("deleteHostel error:", error);
    res.status(500).json({ success: false, message: "Failed to delete hostel", error: error?.message || String(error) });
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

          { new: true }
        );

      res.status(200).json({
        success: true,

        message:
          "Subscription Updated",

        subscription,
      });

    } catch (error) {

      res.status(500).json(error);

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
      ownerId: result.owner._id,
      subscription: subscriptionDoc,
      publicUrl: result.publicLink,
      qrCodeUrl: result.qrCode,
      qrCodeFullUrl: result.qrCode,
      uniqueCode: result.hostel.slug,
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
      { new: true, runValidators: true }
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

    const updated = await Hostel.findByIdAndUpdate(hostelId, updateData, { new: true, runValidators: true }).lean();

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
  resendWhatsApp,
  resetOwnerTempPassword,
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

// Phase 4.2A exports
  getHostels: hostelAdminController.getHostels,
  getHostelById: hostelAdminController.getHostel,
  getHostelOwner: hostelAdminController.getOwner,
};

// ==========================
// OWNERS CRM & RESIDENTS ROLL
// ==========================

const getAllOwnersList = async (req, res) => {
  try {
    const owners = await Owner.find().select("ownerName hostelName phone email hostelId").lean();
    
    // Calculate extra metrics for each owner
    const data = await Promise.all(owners.map(async (o) => {
      let daysRemaining = 0;
      let residentCount = 0;
      let occupancyPercent = 0;
      let monthlyRevenue = 0;
      let storageUsage = "1.2 GB"; // Mocked storage usage as actual size calculation might be complex
      
      if (o.hostelId) {
        const sub = await Subscription.findOne({ hostelId: o.hostelId }).lean();
        if (sub && sub.subscriptionEndDate) {
          const diff = new Date(sub.subscriptionEndDate) - new Date();
          daysRemaining = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
        }
        
        residentCount = await Resident.countDocuments({ hostelId: o.hostelId, status: "active" });
        
        const rooms = await Room.find({ hostelId: o.hostelId }).lean();
        let totalBeds = 0;
        let occupiedBeds = 0;
        rooms.forEach((r) => {
          totalBeds += Number(r.totalBeds || 0);
          occupiedBeds += Number(r.occupiedBeds || 0);
        });
        
        if (totalBeds > 0) {
          occupancyPercent = Math.round((occupiedBeds / totalBeds) * 100);
        }
        
        const payments = await Payment.aggregate([
          { $match: { hostelId: o.hostelId, status: "Paid" } },
          { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        if (payments.length > 0) {
          monthlyRevenue = payments[0].total; // Simplified as total revenue for now
        }
      }

      return {
        name: o.ownerName,
        hostel: o.hostelName || "N/A",
        phone: o.phone,
        email: o.email,
        daysRemaining,
        storageUsage,
        residentCount,
        occupancyPercent,
        monthlyRevenue
      };
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error fetching owners:", error);
    res.status(500).json({ success: false, message: "Server error" });
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
    
    // Add missing metrics
    const trialToPaidConversion = 45; // Mocked percentage for now
    const retentionRate = 95; // Mocked percentage
    const renewalProbability = 80; // Mocked percentage
    const churnPrediction = 5; // Mocked percentage
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
