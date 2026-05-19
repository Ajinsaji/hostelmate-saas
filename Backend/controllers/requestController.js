const HostelRequest = require("../models/HostelRequest");


// CREATE REQUEST
const createRequest = async (req, res) => {
  try {
    console.log("[createRequest] body:", req.body);
    console.log("[createRequest] files:", req.files ? Object.keys(req.files) : null);
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
    } = req.body;

    // Required location fields for new submissions
    if (!state || !district || !pincode) {
      return res.status(400).json({
        success: false,
        message: "state, district, and pincode are required",
      });
    }

    // CHECK EXISTING REQUEST
    const existingRequest =
      await HostelRequest.findOne({
        phone,
      });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message:
          "Application already submitted",
        status: existingRequest.status,
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

    console.log("Saving hostel request...");
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
        aadhaarFile: aadhaarFileName,
        ownerPhoto: ownerPhotoFileName,
        licensePhoto: licensePhotoFileName,
        status: "pending",
      });

    console.log("Hostel request saved successfully:", { id: request?._id, phone, status: request?.status });

    res.status(201).json({
      success: true,
      message:
        "Application Submitted",
      request,
    });
  } catch (error) {
    console.error("createRequest error:", error);

    res.status(500).json({
      success: false,
      message: "Server error while submitting application",
      details: error?.message || String(error),
    });
  }
};


// CHECK STATUS
const checkRequestStatus =
  async (req, res) => {
    try {
      const phone =
        req.params.phone;

      const request =
        await HostelRequest.findOne({
          phone,
        });

      if (!request) {
        return res.status(404).json({
          success: false,
          message:
            "No application found",
        });
      }

      res.status(200).json({
        success: true,
        status: request.status,
        request,
      });
    } catch (error) {
      console.error("checkRequestStatus error:", error);

      res.status(500).json({
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
    console.error("Cancel Request Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel request",
    });
  }
};

module.exports = {
  createRequest,
  checkRequestStatus,
  cancelRequest,
};
