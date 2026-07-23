const { logger } = require("../utils/logger");
const Hostel = require("../models/Hostel");
const Room = require("../models/Room");
const PublicAdmission = require("../models/PublicAdmission");

// GET HOSTEL DETAILS PUBLICLY
const getPublicHostel = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const hostel = await Hostel.findOne({
      $or: [{ uniqueCode: uniqueCode }, { slug: uniqueCode }],
      isPublic: true 
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    // Fetch rooms to show availability
    const rooms = await Room.find({ hostelId: hostel._id });

    // Prepare safe data (no internal tokens or admin data)
    const publicData = {
      _id: hostel._id,
      hostelName: hostel.hostelName,
      address: hostel.address,
      phone: hostel.phone,
      qrCodeUrl: hostel.qrCodeUrl,
      description: hostel.description || "",
      amenities: hostel.amenities || [],
      rulesText: hostel.rulesText || "",
      currentRulesVersion: hostel.currentRulesVersion || "",
      rulesVersionNumber: hostel.rulesVersionNumber || "",
      rulesConfig: hostel.rulesConfig || {},
      rooms: rooms.map((r) => ({
        _id: r._id,
        roomNumber: r.roomNumber,
        type: r.roomType || r.type,
        rent: r.rentPerBed || r.rent,
        capacity: r.totalBeds,
        occupiedBeds: r.occupiedBeds,
        vacantBeds: (r.totalBeds || 0) - (r.occupiedBeds || 0),
      })),
    };

    logger.info("Public hostel response:", {
      rulesText: publicData.rulesText,
      currentRulesVersion: publicData.currentRulesVersion,
      rulesVersionNumber: publicData.rulesVersionNumber,
    });

    res.status(200).json({ success: true, hostel: publicData });
  } catch (error) {
    logger.info(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// SUBMIT ADMISSION
const submitAdmission = async (req, res) => {
  try {
    const { uniqueCode } = req.params;
    const hostel = await Hostel.findOne({
      $or: [{ uniqueCode: uniqueCode }, { slug: uniqueCode }],
      isPublic: true 
    });

    if (!hostel) {
      return res.status(404).json({ success: false, message: "Hostel not found" });
    }

    const {
      residentName,
      phone,
      email,
      emergencyContact,
      address,
      roomPreference,

      // rules agreement fields (immutable snapshot)
      rulesVersionId,
      rulesVersionNumber,
      acceptedRulesTextSnapshot,
      agreementChecked,
      signatureImage,
      signedAt,
    } = req.body;

    logger.info("Admission req.body:", {
      residentName,
      phone,
      email,
      emergencyContact,
      address,
      roomPreference,
      rulesVersionId,
      rulesVersionNumber,
      acceptedRulesTextSnapshot: !!acceptedRulesTextSnapshot,
      agreementChecked,
      signatureImage: !!signatureImage,
      signedAt,
    });

    const getUploadedFileUrl = require("../utils/getUploadedFileUrl");

    // Files (support Cloudinary objects or legacy filename)
    const photoFile = getUploadedFileUrl(req.files?.photoFile?.[0]);
    const idProofFile = getUploadedFileUrl(req.files?.idProofFile?.[0]);
    const signatureFile = getUploadedFileUrl(req.files?.signatureFile?.[0]);


    // Enforce rules agreement + signature for new flow
    // (Legacy flow keeps working for already-stored uploads)
    const isNewSignatureFlow = !!signatureImage;
    const hostelHasRules = !!(hostel.rulesText || hostel.currentRulesVersion || hostel.rulesVersionNumber);

    if (isNewSignatureFlow) {
      const checked = agreementChecked === "true" || agreementChecked === true;
      if (!checked) {
        return res.status(400).json({ success: false, message: "Please accept the rules agreement." });
      }
      if (!signatureImage) {
        return res.status(400).json({ success: false, message: "Please provide your signature." });
      }
      if (hostelHasRules && (!acceptedRulesTextSnapshot || !rulesVersionId || !rulesVersionNumber)) {
        return res.status(400).json({ success: false, message: "Rules agreement snapshot is missing." });
      }
    }

    // Backward compatible validation:
    // - New flow: signatureImage already validated above
    // - Legacy flow: signatureFile required
    const isLegacySignature = !!signatureFile;
    if (!photoFile || !idProofFile || (!isNewSignatureFlow && !isLegacySignature)) {
      return res.status(400).json({ success: false, message: "Please upload photo, ID proof, and signature." });
    }



    const admission = await PublicAdmission.create({
      hostelId: hostel._id,
      hostelCode: uniqueCode,
      residentName,
      phone,
      email,
      emergencyContact,
      address,
      roomPreference,
      photoFile,
      idProofFile,

      // legacy upload signature path
      signatureFile,

      // new immutable agreement fields
      rulesVersionId,
      rulesVersionNumber,
      acceptedRulesTextSnapshot,
      agreementChecked: agreementChecked === "true" || agreementChecked === true,
      signatureImage,
      signedAt: signedAt ? new Date(signedAt) : new Date(),

      paymentStatus: "pending",
      status: "Pending"
    });

    // Notification for owner/admin of this hostel
    try {
      const { publishNotification } = require("../utils/notificationPublisher");
      const Owner = require("../models/Owner");
      const owner = await Owner.findOne({ hostelId: hostel._id, role: "owner" });
      if (owner?._id) {
        await publishNotification({
          userId: owner._id,
          hostelId: hostel._id,
          type: "admission_submitted",
          message: "New resident admission submitted",
          meta: {
            route: "/admissions",
            admissionId: admission._id,
          },
        });
      }
    } catch (e) {
      // never break admission flow
      logger.error("Admission submit notification failed:", e?.message || e);
    }

    res.status(201).json({ success: true, message: "Admission request submitted", admission });


  } catch (error) {
    logger.info(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getPublicHostel,
  submitAdmission
};
