const { logger } = require("../utils/logger");
const HostelRequest = require("../models/HostelRequest");
const { createPerformanceTimer } = require("../utils/performanceTiming");


// ─── Duplicate-key error helper ───────────────────────────────────────────────
// Returns a { code, message } object if err is an E11000 for a known field,
// or null if it is not a duplicate-key error we want to surface.
function parseDuplicateKeyError(err) {
  // MongoDB duplicate-key errors have code 11000
  if (err.code !== 11000) return null;

  const keyPattern = err.keyPattern || {};
  const keyValue   = err.keyValue   || {};

  if (keyPattern.phone || keyValue.phone) {
    return {
      code:    "PHONE_ALREADY_REGISTERED",
      message: "This phone number is already registered. Please use another phone number.",
    };
  }

  if (keyPattern.email || keyValue.email) {
    return {
      code:    "EMAIL_ALREADY_REGISTERED",
      message: "This email address is already registered. Please use another email address.",
    };
  }

  // Unknown unique-index collision — do not expose raw detail
  return {
    code:    "DUPLICATE_FIELD",
    message: "A registration record with this information already exists.",
  };
}


// CREATE REQUEST
const createRequest = async (req, res) => {
  const timer = createPerformanceTimer("createRequest", logger, req);
  try {
    const {
      ownerName,
      phone,
      hostelName,
      ownerAddress,
      hostelAddress,
      state,
      district,
      city,
      pincode,
      hostelType,
    } = req.body;

    // Required location fields for new submissions
    if (!state || !district || !pincode) {
      return res.status(400).json({
        success: false,
        message: "state, district, and pincode are required",
      });
    }

    // Aadhaar 12-digit validation
    const idType = req.body.idType || "Aadhaar";
    const idNumber = String(req.body.idNumber || "").trim();
    if (idType === "Aadhaar" && idNumber) {
      const cleanAadhaar = idNumber.replace(/\D/g, "");
      if (cleanAadhaar.length !== 12) {
        return res.status(400).json({
          success: false,
          message: "Enter a valid 12-digit Aadhaar number.",
        });
      }
    }

    // CHECK EXISTING REQUEST (duplicate prevention — fast pre-check before DB write)
    const existingRequest = await timer.measure("duplicateLookupMs", () => HostelRequest.findOne({
      phone,
      status: {
        $in: ["pending", "approved", "activation_pending", "activated"],
      },
    }));

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        alreadyExists: true,
        status: existingRequest.status,
        hostelName: existingRequest.hostelName,
        requestId: existingRequest._id,
        message: "A request already exists for this phone number.",
      });
    }


    // CREATE REQUEST
    // Also ensure uploads directory exists.
    const fs = require("fs");
    const path = require("path");
    const uploadsDir = path.join(__dirname, "..", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // If your client didn't send expected multipart fields,
    // req.files will be missing and multer won't write files.
    // Avoid any further path usage by validating here.
    const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

    const aadhaarFileName = getUploadedFileUrl(req.files?.aadhaarFile?.[0]) || req.files?.aadhaarFile?.[0]?.filename || req.body.aadhaarFile || req.body.aadhaarPhoto || "default_aadhaar.png";
    const aadhaarBackName = getUploadedFileUrl(req.files?.aadhaarBack?.[0]) || req.files?.aadhaarBack?.[0]?.filename || req.body.aadhaarBack || "";
    const selfieName = getUploadedFileUrl(req.files?.selfie?.[0]) || req.files?.selfie?.[0]?.filename || req.body.selfie || "";
    const ownerPhotoFileName = getUploadedFileUrl(req.files?.ownerPhoto?.[0]) || req.files?.ownerPhoto?.[0]?.filename || req.body.ownerPhoto || selfieName || "default_owner.png";
    const licensePhotoFileName = getUploadedFileUrl(req.files?.licensePhoto?.[0]) || req.files?.licensePhoto?.[0]?.filename || req.body.licensePhoto || "default_license.png";

    // Basic server-side pincode validation (6 digits)
    const safePincode = pincode === undefined ? undefined : String(pincode);
    if (safePincode !== undefined && safePincode.trim() !== "") {
      if (!/^\d{6}$/.test(safePincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must be exactly 6 digits",
        });
      }
    }

    // Determine source & createdBy from authenticated server context (prevent client spoofing)
    const AuditLog = require("../models/AuditLog");
    const isAuthAdmin = !!(req.user || req.admin);
    const adminId = req.user?.id || req.user?.userId || req.user?._id || req.admin?._id || req.admin?.id || null;
    const requestSource = isAuthAdmin ? "admin" : "public";

    logger.info(`Saving hostel request (source: ${requestSource})...`);
    const request = await timer.measure("databaseCreateMs", () => HostelRequest.create({
      ownerName,
      phone,
      email: req.body.email || "",
      company: req.body.company || "",
      hostelName,
      ownerAddress: ownerAddress || "",
      hostelAddress: hostelAddress || "",
      state: state || "",
      district: district || "",
      city: city || "",
      pincode: safePincode || "",
      hostelType: hostelType || "PG",
      ownerPincode: req.body.ownerPincode || safePincode || "",
      ownerState: req.body.ownerState || state || "",
      ownerDistrict: req.body.ownerDistrict || district || "",
      ownerCity: req.body.ownerCity || city || "",
      aadhaarFile: aadhaarFileName,
      aadhaarBack: aadhaarBackName,
      selfie: selfieName,
      ownerPhoto: ownerPhotoFileName,
      licensePhoto: licensePhotoFileName,
      idType: req.body.idType || "Aadhaar",
      idNumber: req.body.idNumber || "",
      altPhone: req.body.altPhone || "",
      roomsCount: Number(req.body.roomsCount || req.body.rooms) || 0,
      capacity: Number(req.body.capacity) || 0,
      amenities: Array.isArray(req.body.amenities) ? req.body.amenities : [],
      status: "pending",
      source: requestSource,
      createdBy: adminId,
      timeline: [
        {
          action: isAuthAdmin ? "Registration Request Created by Admin" : "Public Registration Submitted",
          by: isAuthAdmin ? (req.user?.role || "SuperAdmin") : "Public",
          date: new Date()
        }
      ]
    }));

    if (isAuthAdmin && adminId) {
      await timer.measure("auditCreationMs", () => AuditLog.create({
        adminId,
        action: "ADMIN_CREATED_REGISTRATION_REQUEST",
        actionType: "CREATE",
        entity: "HostelRequest",
        targetId: request._id,
        details: {
          hostelName: request.hostelName,
          ownerName: request.ownerName,
          phone: request.phone,
          source: "admin",
          message: `Admin created hostel registration request for ${request.hostelName} (${request.ownerName})`
        },
        timestamp: new Date()
      }).catch(() => {}));
    }

    logger.info("Hostel request saved successfully");
    logger.info(`[HostelRequest] Request saved: requestId=${request._id}`);

    // Notify SuperAdmins / Admins of new registration request via push notification
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Admin = require("../models/Admin");
      const admins = await Admin.find({ role: { $in: ["super_admin", "admin"] } }).select("_id role").lean();
      for (const adminDoc of admins || []) {
        await publishNotification({
          userId: adminDoc._id,
          role: adminDoc.role || "super_admin",
          type: "registration_submitted",
          category: "system",
          priority: "high",
          title: "New Owner Registration Request",
          message: `New registration request for "${request.hostelName || "Hostel"}" by ${request.ownerName || "Owner"}.`,
          actionUrl: "/admin/requests",
          meta: {
            route: "/admin/requests",
            deepLink: "/admin/requests",
            requestId: String(request._id),
          },
        });
      }
    } catch (adminNotifErr) {
      logger.error("[HostelRequest] Admin notification failed:", adminNotifErr?.message || adminNotifErr);
    }

    timer.finish("Registration performance");
    return res.status(201).json({
      success: true,
      message: isAuthAdmin ? "Manual Owner Registration Request Created" : "Application Submitted",
      request,
      requestId: request?._id || request?.id,
    });
  } catch (error) {
    // ── Intercept MongoDB duplicate-key errors (E11000) ──────────────────────
    const dupKeyInfo = parseDuplicateKeyError(error);
    if (dupKeyInfo) {
      // Log at warn level only (no stack trace exposure to client)
      logger.warn("Duplicate key on registration:", dupKeyInfo.code, {
        code: dupKeyInfo.code,
        keyPattern: error.keyPattern,
      });

      return res.status(409).json({
        success: false,
        code:    dupKeyInfo.code,
        message: dupKeyInfo.message,
      });
    }

    // All other unexpected errors
    logger.error("CREATE REQUEST ERROR:", error?.message || error);

    res.status(500).json({
      success: false,
      message: "Server error while submitting application",
      error: error?.message || String(error),
    });
  }
};


// CHECK STATUS + OWNER STATUS API
// GET /api/request/status/:phone
// and will also be compatible with the new spec endpoint.
const checkRequestStatus = async (req, res) => {
  try {
    let phone = String(req.params.phone || "").trim();

    phone = phone
      .replace(/[\s-]/g, "")
      .replace(/^\+/, "");

    logger.info("Incoming phone:", req.params.phone);
    logger.info("Normalized phone:", phone);


    // const latestRequests = await HostelRequest
    //   .find({})
    //   .sort({ createdAt: -1 })
    //   .limit(5)
    //   .select("phone ownerPhone mobile contactNumber hostelName status");

    // logger.info("Latest HostelRequests:", latestRequests);

    const request = await HostelRequest
      .findOne({ phone })
      .sort({ createdAt: -1 });

    logger.info("Found request:", request);




    if (!request) {
      return res.status(404).json({
        success: false,
        message: "No application found",
      });
    }

    return res.status(200).json({
      success: true,
      requestId: request._id,
      hostelName: request.hostelName,
      phone: request.phone,
      status: request.status,
      submittedAt: request.createdAt,
    });
  } catch (error) {
    logger.error("checkRequestStatus error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error while checking application status",
    });
  }
};



const cancelRequest = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid request ID format",
      });
    }

    const request = await HostelRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel an application that has already been processed.",
      });
    }

    await HostelRequest.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Request cancelled successfully",
    });
  } catch (error) {
    logger.error("Cancel Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel request",
    });
  }
};

const deleteRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await HostelRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    await HostelRequest.findByIdAndDelete(id);

    return res.json({
      success: true,
      message: "Request deleted successfully",
    });
  } catch (error) {
    logger.error("DELETE REQUEST ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete request",
    });
  }
};

const pincodeCache = new Map();

const lookupPincode = async (req, res) => {
  try {
    const { pincode } = req.params;
    const cleanPin = String(pincode || "").trim();

    if (!/^\d{6}$/.test(cleanPin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid pincode format. Must be 6 digits.",
      });
    }

    if (pincodeCache.has(cleanPin)) {
      return res.status(200).json({
        success: true,
        cached: true,
        data: pincodeCache.get(cleanPin),
      });
    }

    const axios = require("axios");
    const response = await axios.get(`https://api.postalpincode.in/pincode/${cleanPin}`, {
      timeout: 5000,
    });

    if (
      Array.isArray(response.data) &&
      response.data[0]?.Status === "Success" &&
      Array.isArray(response.data[0]?.PostOffice) &&
      response.data[0].PostOffice.length > 0
    ) {
      const postOffices = response.data[0].PostOffice;
      const primary = postOffices[0];

      const result = {
        pincode: cleanPin,
        place: primary.Name || "",
        district: primary.District || "",
        state: primary.State || "",
        places: postOffices.map((po) => po.Name).filter(Boolean),
      };

      pincodeCache.set(cleanPin, result);

      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    return res.status(444 || 404).json({
      success: false,
      message: "Could not find location details for this pincode.",
    });
  } catch (error) {
    logger.error("PINCODE LOOKUP ERROR:", error?.message || error);
    return res.status(500).json({
      success: false,
      message: "Pincode lookup service unavailable",
    });
  }
};

module.exports = {
  createRequest,
  checkRequestStatus,
  cancelRequest,
  deleteRequest,
  lookupPincode,
};
