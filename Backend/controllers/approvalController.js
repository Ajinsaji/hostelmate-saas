const { logger } = require("../utils/logger");
const HostelRequest = require("../models/HostelRequest");

// Safe lightweight endpoint used ONLY for UX persistence.
// Does NOT create sessions / tokens.
const checkHostelRequestApproval = async (req, res) => {
  try {
    const { phone } = req.query || {};

    // Since current registration stores phone and HostelRequest schema has no email,
    // we use phone as the stable identifier.
    if (!phone) {
      return res.status(400).json({
        approved: false,
        rejected: false,
        status: "Unknown",
        message: "Missing phone",
      });
    }

    const request = await HostelRequest.findOne({ phone });

    if (!request) {
      return res.status(200).json({
        approved: false,
        rejected: false,
        status: "NotFound",
      });
    }

    const normalized = String(request.status || "pending").toLowerCase();
    const approved = normalized === "approved";
    const rejected = normalized === "rejected";


    return res.status(200).json({
      approved,
      rejected,
      status: request.status,
      requestId: request._id,
    });
  } catch (e) {
    return res.status(500).json({
      approved: false,
      rejected: false,
      status: "Error",
      message: e?.message || String(e),
    });
  }
};

const { approveHostelRegistration } = require("../services/onboardingService");
const Subscription = require("../models/Subscription");
const Hostel = require("../models/Hostel");
const Owner = require("../models/Owner");

const approveOnboardingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const requestData = req.body || {};
    
    let existingRequest = null;
    if (id && id !== "new") {
      existingRequest = await HostelRequest.findById(id);
    } else if (id === "new") {
      // Create a new HostelRequest in status 'pending' for manual admin creation
      const newRequest = await HostelRequest.create({
        ownerName: requestData.ownerName || requestData.fullName || "Owner",
        phone: requestData.phone || "",
        email: requestData.email || "",
        company: requestData.company || "",
        hostelName: requestData.hostelName || "Hostel",
        ownerAddress: requestData.address || requestData.ownerAddress || "",
        hostelAddress: requestData.address || requestData.hostelAddress || "",
        city: requestData.city || "",
        district: requestData.district || requestData.city || "",
        state: requestData.state || "",
        pincode: requestData.pincode || "110001",
        hostelType: requestData.hostelType || "PG",
        aadhaarFile: requestData.aadhaarFile || requestData.aadhaarPhoto || "default_aadhaar.png",
        aadhaarBack: requestData.aadhaarBack || "",
        selfie: requestData.selfie || "",
        ownerPhoto: requestData.ownerPhoto || requestData.selfie || "default_owner.png",
        licensePhoto: requestData.licensePhoto || "default_license.png",
        idType: requestData.idType || "Aadhaar",
        idNumber: requestData.idNumber || "",
        altPhone: requestData.altPhone || "",
        roomsCount: Number(requestData.roomsCount || requestData.rooms) || 0,
        capacity: Number(requestData.capacity) || 0,
        amenities: Array.isArray(requestData.amenities) ? requestData.amenities : [],
        status: "pending",
        timeline: [{ action: "Admin Manual Registration Created", by: "Admin" }]
      });

      return res.status(201).json({
        success: true,
        message: "Owner Registration Created Successfully (Pending Approval)",
        status: "pending",
        request: newRequest,
        requestId: newRequest._id,
      });
    }

    const payload = {
      hostelName: requestData.hostelName || existingRequest?.hostelName || "Hostel",
      ownerName: requestData.ownerName || existingRequest?.ownerName || "Owner",
      email: requestData.email || existingRequest?.email || "",
      phone: requestData.phone || existingRequest?.phone || "",
      city: requestData.city || existingRequest?.city || "",
      address: requestData.address || existingRequest?.hostelAddress || existingRequest?.ownerAddress || "",
      coverImage: requestData.coverImage || "",
      logo: requestData.logo || "",
      aadhaarFile: requestData.aadhaarFile || existingRequest?.aadhaarFile || "",
      licensePhoto: requestData.licensePhoto || existingRequest?.licensePhoto || ""
    };

    // Check if an unactivated draft hostel already exists for this request or phone
    let resultHostel = null;
    if (existingRequest?.hostelId) {
      resultHostel = await Hostel.findById(existingRequest.hostelId);
    }
    if (!resultHostel && payload.phone) {
      resultHostel = await Hostel.findOne({
        phone: payload.phone,
        isDeleted: false,
        pendingActivation: true,
      });
    }

    if (!resultHostel) {
      // Call shared service to create Hostel draft (pendingActivation = true)
      const result = await approveHostelRegistration(payload);
      resultHostel = result.hostel;
    }

    const hostelId = resultHostel._id;

    if (id && id !== "new") {
      await HostelRequest.findByIdAndUpdate(id, {
        status: "activation_pending",
        hostelId: hostelId,
        $push: { timeline: { action: "Approved - Activation Pending", by: req.user?.role || "SuperAdmin" } }
      });
    }

    // System Notification
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Admin = require("../models/Admin");
      const superAdmins = await Admin.find({ role: { $in: ["super_admin", "admin"] } });
      for (const admin of superAdmins || []) {
        await publishNotification({
          userId: admin._id,
          type: "system_update",
          title: "Hostel Request Approved",
          message: `${payload.hostelName} - Activation Pending (Subscription Setup Required)`,
          meta: { route: "/admin/hostels", relatedId: hostelId },
          role: admin.role,
        });
      }
    } catch (e) {
      logger.error("Hostel approval notification failed:", e?.message || e);
    }

    res.status(200).json({ 
      success: true, 
      hostelId, 
      status: "activation_pending",
      requiresSubscriptionSetup: true,
      message: "Hostel request approved. Proceed to subscription setup for final activation." 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectOnboardingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const request = await HostelRequest.findByIdAndUpdate(id, {
      status: "rejected",
      rejectionReason: reason,
      $push: { timeline: { action: "Rejected", by: "SuperAdmin" } }
    }, { returnDocument: "after" });
    
    // Notify Owner (Placeholder for email/sms since actual implementation might need twilio/smtp)
    logger.info(`[Notification] Sent rejection to ${request?.phone || 'unknown'}: ${reason}`);

    res.status(200).json({ success: true, message: "Request rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const assignOnboardingRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    await HostelRequest.findByIdAndUpdate(id, {
      assignedTo: adminId,
      $push: { timeline: { action: `Assigned to ${adminId}`, by: "SuperAdmin" } }
    });
    res.status(200).json({ success: true, message: "Request assigned" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  checkHostelRequestApproval,
  approveOnboardingRequest,
  rejectOnboardingRequest,
  assignOnboardingRequest
};

