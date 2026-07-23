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
    const requestData = req.body;
    
    // Call existing shared service
    const result = await approveHostelRegistration({
      hostelName: requestData.hostelName,
      ownerName: requestData.ownerName,
      email: requestData.email,
      phone: requestData.phone,
      city: requestData.city,
      address: requestData.address,
      coverImage: requestData.coverImage,
      logo: requestData.logo,
      aadhaarFile: requestData.aadhaarFile,
      licensePhoto: requestData.licensePhoto
    });

    const hostelId = result.hostel._id;
    const tempPassword = result.tempPassword;

    // Finalize Activation logic
    await Hostel.findByIdAndUpdate(hostelId, {
      pendingActivation: false,
      subscriptionStatus: "active",
      planType: requestData.planType || "Pro",
    });

    const subscriptionDoc = await Subscription.create({
      hostelId: hostelId,
      planType: requestData.planType || "Pro",
      subscriptionStatus: "active",
      amount: requestData.amount || 0,
      subscriptionStartDate: new Date(),
      residentLimit: 60
    });

    if (id && id !== "new") {
      await HostelRequest.findByIdAndUpdate(id, {
        status: "activated",
        hostelId: hostelId,
        $push: { timeline: { action: "Approved & Activated", by: "SuperAdmin" } }
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
          message: `${requestData.hostelName} - Activated`,
          meta: { route: "/admin/hostels", relatedId: hostelId },
          role: admin.role,
        });
      }
    } catch (e) {
      logger.error("Hostel approval notification failed:", e?.message || e);
    }

    // Try to send WhatsApp via existing util if available
    try {
      const { sendOwnerOnboarding } = require("../utils/sendOwnerOnboarding");
      const loginUrl = process.env.PUBLIC_URL || "https://hostelmate-saas.vercel.app/login";
      await sendOwnerOnboarding({
        ownerName: requestData.ownerName,
        hostelName: requestData.hostelName,
        phone: requestData.phone,
        username: requestData.phone,
        tempPassword,
        planType: requestData.planType || "Pro",
        expiryDate: subscriptionDoc.subscriptionEndDate,
        qrUrl: result.qrCode,
        loginUrl,
      });
    } catch (e) {
      logger.error("WhatsApp notification failed:", e);
    }

    res.status(200).json({ success: true, hostelId, tempPassword, message: "Onboarding complete" });
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
    }, { new: true });
    
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

