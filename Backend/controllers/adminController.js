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

const { generateQRCode } = require('../utils/qrCodeService');
const { sendApprovalMessages } = require('../utils/messageService');



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

const approveHostel =
  async (req, res) => {
    try {
      const request = await HostelRequest.findById(req.params.id);


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

          // Location (safe for new + updated approvals)
          state: request.state || "",
          district: request.district || "",
          city: request.city || "",
          pincode: request.pincode || "",
          hostelType: request.hostelType || "",
          
          uniqueCode: uniqueCode,
          publicUrl: publicUrl,
          qrCodeUrl: qrResult.url,
          isPublic: true,
        });

      // CREATE SUBSCRIPTION (match manual add-hostel trial initialization)
      {
        const now = new Date();
        const trialEnd = new Date(now);
        trialEnd.setDate(now.getDate() + 7);

        const subscriptionDoc = await Subscription.create({
          hostelId: hostel._id,
          planType: "Basic",
          subscriptionStatus: "trial",
          isTrial: true,
          trialStartDate: now,
          trialEndDate: trialEnd,
          subscriptionStartDate: now,
          subscriptionEndDate: trialEnd,
          // keep existing schema flexible: if fields exist they get persisted
          residentLimit: 60,
          multiHostelEnabled: false,
          amount: 0,
          isFreeAccess: true,
        });

        // ensure hostel has canonical subscription display fields (some UIs read from Hostel)
        hostel.subscriptionStatus = subscriptionDoc.subscriptionStatus || "trial";
        hostel.planType = subscriptionDoc.planType || "Basic";
        hostel.subscriptionStartDate = subscriptionDoc.subscriptionStartDate || now;
        hostel.subscriptionEndDate = subscriptionDoc.subscriptionEndDate || trialEnd;
        hostel.isFreeAccess = subscriptionDoc.isFreeAccess;
        hostel.isTrial = subscriptionDoc.isTrial;
        await hostel.save();
      }


      // CREATE OWNER
      await Owner.create({
        hostelId: hostel._id,
        ownerName: request.ownerName,
        phone: request.phone,
        password: tempPassword,
        tempPassword: tempPassword,
        profileImage: request.ownerPhoto || "",
        role: "owner",
        status: "active",
      });

      // SEND WHATSAPP & SMS
      await sendApprovalMessages(request.phone, request.ownerName, request.hostelName, request.phone, tempPassword, publicUrl);

// UPDATE REQUEST STATUS
      request.status = "approved";
      await request.save();

      res.status(200).json({
        success: true,
        message: "Hostel Approved Successfully",
        qrCodeUrl: qrResult.url,
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
      const owner = await Owner.findOne({ hostelId: hostel._id }).lean();
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
        owner: {
          name: owner?.ownerName || hostel.ownerName || "N/A",
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
        approvalStatus: hostel.approvalStatus || hostel.status || "approved",
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

    // Check for duplicate owner phone
    const existingOwner = await Owner.findOne({ phone });
    if (existingOwner) {
      return res.status(400).json({
        success: false,
        message: "An owner with this phone number already exists",
      });
    }

    const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

    // Uploads (support Cloudinary secure URLs or legacy filenames)
    const aadhaarFileName = getUploadedFileUrl(req.files?.aadhaarFile?.[0]) || req.files?.aadhaarFile?.[0]?.filename;
    const ownerPhotoFileName = getUploadedFileUrl(req.files?.ownerPhoto?.[0]) || req.files?.ownerPhoto?.[0]?.filename;
    const licensePhotoFileName = getUploadedFileUrl(req.files?.licensePhoto?.[0]) || req.files?.licensePhoto?.[0]?.filename;

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

      state: state || "",
      district: district || "",
      city: city || "",
      pincode: pincode || "",
      hostelType: hostelType || "",
      uniqueCode: uniqueCode,
      publicUrl: publicUrl,
      qrCodeUrl: qrResult.url,
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
      profileImage: ownerPhotoFileName || "",
      role: "owner",
      status: "active",
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
      qrCodeUrl: qrResult.url,
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

  editHostelLocation,
  
  resendWhatsApp,
  
  resetOwnerTempPassword,
  
  getAdminProfile,
  
  updateAdminProfile,
  
  changeAdminPassword,
};
