const HostelRequest = require(
  "../models/HostelRequest"
);

const Hostel = require(
  "../models/Hostel"
);

const Subscription = require(
  "../models/Subscription"
);

const Owner = require(
  "../models/Owner"
);

const Room = require("../models/Room");

const { generateQRCode } = require('../utils/qrCodeService');
const { sendApprovalMessages } = require('../utils/messageService');



// ==========================
// DASHBOARD STATS
// ==========================

const getDashboardStats =
  async (req, res) => {
    try {

      const pendingHostels =
        await HostelRequest.countDocuments(
          {
            status: "Pending",
          }
        );

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

const approveHostel =
  async (req, res) => {
    try {

      const request =
        await HostelRequest.findById(
          req.params.id
        );

      if (!request) {
        return res.status(404).json({
          success: false,

          message:
            "Request not found",
        });
      }

      // Check for duplicate phone
      const existingOwner = await Owner.findOne({ phone: request.phone });
      if (existingOwner) {
        return res.status(400).json({
          success: false,
          message: "An owner with this phone number already exists.",
        });
      }

      // GENERATE PUBLIC URL AND QR
      const uniqueCode = "RMH" + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5).toUpperCase();
      const frontendUrl = process.env.FRONTEND_URL;
      const publicUrl = `${frontendUrl}/h/${uniqueCode}`;
      const qrFilename = `${uniqueCode}-QR.png`;
      
      // Generate QR code with error handling
      const qrResult = await generateQRCode(publicUrl, qrFilename);
      console.log("Generated QR:", { data: publicUrl, filename: qrFilename, result: qrResult });
      if (!qrResult.success) {
        console.error('QR Generation failed:', qrResult.error);
        return res.status(500).json({
          success: false,
          message: "Failed to generate QR code: " + qrResult.error,
        });
      }

      const tempPassword = "Temp@123";

      // CREATE HOSTEL
      const hostel =
        await Hostel.create({
          hostelName:
            request.hostelName,

          ownerName:
            request.ownerName,

          phone:
            request.phone,

          address:
            request.hostelAddress,
          
          uniqueCode: uniqueCode,
          publicUrl: publicUrl,
          qrCodeUrl: qrFilename,
          isPublic: true,
        });

      // CREATE SUBSCRIPTION
      await Subscription.create({
        hostelId:
          hostel._id,

        planType:
          "Basic",

        subscriptionStatus:
          "trial",

        isTrial: true,

        residentLimit: 60,

        multiHostelEnabled:
          false,
      });

      // CREATE OWNER
      await Owner.create({
        hostelId: hostel._id,
        ownerName: request.ownerName,
        phone: request.phone,
        password: tempPassword,
        tempPassword: tempPassword,
        role: "owner",
        status: "active",
      });

      // SEND WHATSAPP & SMS
      await sendApprovalMessages(request.phone, request.ownerName, request.hostelName, request.phone, tempPassword, publicUrl);

      // UPDATE REQUEST STATUS
      request.status =
        "Approved";

      await request.save();

      res.status(200).json({
        success: true,
        message: "Hostel Approved Successfully",
        qrCodeUrl: qrFilename,
        qrCodeFullUrl: qrResult.url,
        publicUrl: publicUrl,
        username: request.phone,
        tempPassword: tempPassword
      });

    } catch (error) {

      console.log(error);

      res.status(500).json(error);

    }
  };


// ==========================
// REJECT REQUEST
// ==========================

const rejectRequest =
  async (req, res) => {
    try {

      await HostelRequest.findByIdAndUpdate(
        req.params.id,

        {
          status:
            "Rejected",
        }
      );

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
// GET ALL HOSTELS
// ==========================

const getAllHostels = async (req, res) => {
  try {
    const hostels = await Hostel.find().lean();

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
      const owner = await Owner.findOne({ hostelId: hostel._id });
      const subscription = await Subscription.findOne({ hostelId: hostel._id });

      let totalBeds = 0;
      let occupiedBeds = 0;
      const rooms = await Room.find({ hostelId: hostel._id });
      (rooms || []).forEach((r) => {
        totalBeds += r.totalBeds || 0;
        occupiedBeds += r.occupiedBeds || 0;
      });

      result.push({
        ...hostel,
        hostelId: hostel._id,
        ownerId: owner && owner._id ? owner._id : undefined,
        ownerName: owner && owner.ownerName ? owner.ownerName : undefined,
        phone: owner && owner.phone ? owner.phone : undefined,
        tempPassword: owner && owner.tempPassword ? owner.tempPassword : "Temp@123",
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
        occupancy: { totalBeds, occupiedBeds },
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
    const owner = await Owner.findById(ownerId).populate("hostelId");
    if (!owner) return res.status(404).json({ success: false, message: "Owner not found" });

    const hostel = owner.hostelId;
    if (!hostel) return res.status(404).json({ success: false, message: "Hostel not found" });

    const { generateResendWhatsAppURL } = require('../utils/messageService');
    const whatsappURL = generateResendWhatsAppURL(
      hostel.hostelName, 
      owner.phone, 
      owner.tempPassword || "Temp@123", 
      hostel.publicUrl, 
      owner.phone
    );
    
    // Call the message service to log
    const result = await sendApprovalMessages(owner.phone, owner.ownerName, hostel.hostelName, owner.phone, owner.tempPassword || "Temp@123", hostel.publicUrl);
    
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
    owner.password = newTempPassword;
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

const deleteHostel =
  async (req, res) => {
    try {

      await Hostel.findByIdAndDelete(
        req.params.id
      );

      await Subscription.deleteMany({
        hostelId:
          req.params.id,
      });

      res.status(200).json({
        success: true,

        message:
          "Hostel Deleted",
      });

    } catch (error) {

      res.status(500).json(error);

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
      subscription,
    } = req.body;

    if (!hostelName || !ownerName || !phone) {
      return res.status(400).json({
        success: false,
        message: "hostelName, ownerName, phone are required",
      });
    }

    // Check for duplicate owner phone
    const existingOwner = await Owner.findOne({ phone });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "An owner with this phone number already exists",
      });
    }

    // Uploads
    const aadhaarFileName = req.files?.aadhaarFile?.[0]?.filename;
    const ownerPhotoFileName = req.files?.ownerPhoto?.[0]?.filename;
    const licensePhotoFileName = req.files?.licensePhoto?.[0]?.filename;

    const subPayload =
      typeof subscription === "string"
        ? JSON.parse(subscription)
        : subscription || {};

    const ownerPassword = req.body.ownerPassword || "123456";

    // ==========================
    // GENERATE PUBLIC URL + QR (match approveHostel)
    // ==========================
    const uniqueCode =
      "RMH" +
      Date.now().toString().slice(-6) +
      Math.random().toString(36).substring(2, 5).toUpperCase();

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "https://hostelmate-saas.vercel.app";

    const publicUrl = `${frontendUrl}/h/${uniqueCode}`;

    const qrFilename = `${uniqueCode}-QR.png`;

    // Generate QR code with error handling
    const qrResult = await generateQRCode(publicUrl, qrFilename);
    console.log("Generated QR:", { data: publicUrl, filename: qrFilename, result: qrResult });
    if (!qrResult.success) {
      console.error('QR Generation failed:', qrResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate QR code: " + qrResult.error,
      });
    }

    // Create hostel
    const hostel = await Hostel.create({
      hostelName,
      ownerName,
      phone,
      address: hostelAddress,
      uniqueCode: uniqueCode,
      publicUrl: publicUrl,
      qrCodeUrl: qrFilename,
      isPublic: true,

      subscriptionStatus: subPayload.subscriptionStatus || "trial",
      planType: subPayload.planType || "Basic",
      subscriptionStartDate: subPayload.subscriptionStartDate,
      subscriptionEndDate: subPayload.subscriptionEndDate,
      isFreeAccess: Boolean(subPayload.isFreeAccess),
      licensePhoto: licensePhotoFileName,
    });

    // Create owner
    const owner = await Owner.create({
      hostelId: hostel._id,
      ownerName,
      phone,
      password: ownerPassword,
      tempPassword: ownerPassword,
      role: "owner",
      status: "active",
      aadhaarFile: aadhaarFileName,
      ownerPhoto: ownerPhotoFileName,
    });

    // Create subscription
    const subscriptionDoc = await Subscription.create({
      hostelId: hostel._id,
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
      hostel,
      ownerId: owner._id,
      subscription: subscriptionDoc,
      publicUrl,
      qrCodeUrl: qrFilename,
      qrCodeFullUrl: qrResult.url,
      uniqueCode,
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
module.exports = {

  getDashboardStats,

  getAllRequests,

  approveHostel,

  rejectRequest,

  getAllHostels,

  deleteHostel,

  updateSubscription,

  getSubscriptions,

  addHostel,
  
  resendWhatsApp,
  
  resetOwnerTempPassword,
  
  getAdminProfile,
  
  updateAdminProfile,
  
  changeAdminPassword,
};
