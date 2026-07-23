const { logger } = require("../utils/logger");
const HostelRequest = require("../models/HostelRequest");


// CREATE REQUEST
const createRequest = async (req, res) => {
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

    // CHECK EXISTING REQUEST (duplicate prevention)
    const existingRequest = await HostelRequest.findOne({
      phone,
      status: {
        $in: ["pending", "approved", "activation_pending", "activated"],
      },
    });

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

    const aadhaarFileName = getUploadedFileUrl(req.files?.aadhaarFile?.[0]) || req.files?.aadhaarFile?.[0]?.filename;
    const ownerPhotoFileName = getUploadedFileUrl(req.files?.ownerPhoto?.[0]) || req.files?.ownerPhoto?.[0]?.filename;
    const licensePhotoFileName = getUploadedFileUrl(req.files?.licensePhoto?.[0]) || req.files?.licensePhoto?.[0]?.filename;

    // Fail fast with a useful error instead of saving nulls.
    if (!aadhaarFileName || !ownerPhotoFileName || !licensePhotoFileName) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required uploads. Expected fields: aadhaarFile, ownerPhoto, licensePhoto.",
        receivedFiles: req.files || {},
      });
    }

    // Basic server-side pincode validation (6 digits)
    const safePincode = pincode === undefined ? undefined : String(pincode);
    if (safePincode !== undefined) {
      if (!/^\d{6}$/.test(safePincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must be exactly 6 digits",
        });
      }
    }

    logger.info("Saving hostel request...");
    const request =
      await HostelRequest.create({
        ownerName,
        phone,
        hostelName,
        ownerAddress,
        hostelAddress,
        state: state || "",
        district: district || "",
        city: city || "",
        pincode: safePincode || "",
        hostelType: hostelType || "",
        aadhaarFile: aadhaarFileName,
        ownerPhoto: ownerPhotoFileName,
        licensePhoto: licensePhotoFileName,
        status: "pending",
      });

    logger.info("Hostel request saved successfully");

    res.status(201).json({
      success: true,
      message: "Application Submitted",
      request,
      requestId: request?._id || request?.id,
    });
  } catch (error) {
    logger.error("CREATE REQUEST ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error while submitting application",
      details: error?.message || String(error),
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
      details: error?.message || String(error),
    });
  }
};



const cancelRequest = async (req, res) => {
  try {
    const deleted = await HostelRequest.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

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

module.exports = {
  createRequest,
  checkRequestStatus,
  cancelRequest,
  deleteRequest,
};


