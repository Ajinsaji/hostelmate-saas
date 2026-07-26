const residentService = require("../services/residentService");
const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
const { logger } = require("../utils/logger");
const {
  createResidentSchema,
  updateResidentSchema,
  checkInSchema,
  checkOutSchema,
  transferSchema,
  statusSchema,
} = require("../validations/residentValidation");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

/**
 * POST /api/residents
 * Create Resident / Admission
 */
const createResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    if (!userCtx.hostelId) {
      return res.status(401).json({ success: false, message: "Unauthorized: Missing hostelId" });
    }

    const payload = { ...req.body };

    // Handle file uploads if present
    if (req.files?.photo?.[0]) {
      payload.photo = getUploadedFileUrl(req.files.photo[0]);
    }
    if (req.files?.idProof?.[0]) {
      payload.idProof = getUploadedFileUrl(req.files.idProof[0]);
    }
    if (req.files?.signatureFile?.[0]) {
      payload.signatureFile = getUploadedFileUrl(req.files.signatureFile[0]);
    }

    const { error, value } = createResidentSchema.validate(payload, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const resident = await residentService.createResident(value, userCtx);

    // If roomId & bedId provided on creation, trigger check-in assignment automatically
    if (value.roomId && value.bedId) {
      try {
        await residentService.checkInResident(
          { residentId: resident._id, roomId: value.roomId, bedId: value.bedId },
          userCtx
        );
      } catch (checkInErr) {
        logger.error("Auto check-in error on creation:", checkInErr);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Resident Added Successfully",
      resident,
    });
  } catch (error) {
    logger.error("createResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Failed to create resident" });
  }
};

/**
 * GET /api/residents
 * List residents with filtering, pagination, and sorting
 */
const getResidentsByHostel = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { page, limit, search, status, roomId, gender, foodPreference, isDeleted, sortBy, sortOrder } = req.query;

    const result = await residentService.getResidentsList({
      hostelId: userCtx.hostelId,
      page,
      limit,
      search,
      status,
      roomId,
      gender,
      foodPreference,
      isDeleted,
      sortBy,
      sortOrder,
    });

    return res.status(200).json({
      success: true,
      residents: result.residents,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    logger.error("getResidentsByHostel error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/residents/statistics
 * Summary counts for dashboard cards
 */
const getResidentStatistics = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const stats = await residentService.getResidentStatistics(userCtx.hostelId);
    return res.status(200).json({ success: true, ...stats });
  } catch (error) {
    logger.error("getResidentStatistics error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/residents/search
 * Global multi-field search
 */
const searchResidents = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { q, query } = req.query;
    const searchStr = q || query || "";

    const result = await residentService.getResidentsList({
      hostelId: userCtx.hostelId,
      search: searchStr,
      limit: 50,
    });

    return res.status(200).json({ success: true, residents: result.residents });
  } catch (error) {
    logger.error("searchResidents error:", error);
    return res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

/**
 * GET /api/residents/:residentId
 * Resident 360 profile with audit history
 */
const getSingleResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const residentId = req.params.residentId || req.params.id;

    const profile = await residentService.getResidentProfile(residentId, userCtx.hostelId);
    return res.status(200).json({
      success: true,
      resident: profile.resident,
      auditHistory: profile.auditHistory,
    });
  } catch (error) {
    logger.error("getSingleResident error:", error);
    return res.status(404).json({ success: false, message: error.message || "Resident not found" });
  }
};

/**
 * PUT /api/residents/:residentId
 * Update Resident Profile
 */
const updateResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const residentId = req.params.residentId || req.params.id;
    const payload = { ...req.body };

    if (req.files?.photo?.[0]) {
      payload.photo = getUploadedFileUrl(req.files.photo[0]);
    }
    if (req.files?.idProof?.[0]) {
      payload.idProof = getUploadedFileUrl(req.files.idProof[0]);
    }

    const { error, value } = updateResidentSchema.validate(payload, { allowUnknown: true });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const updatedResident = await residentService.updateResident(residentId, value, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Updated",
      updatedResident,
      resident: updatedResident,
    });
  } catch (error) {
    logger.error("updateResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Update failed" });
  }
};

/**
 * DELETE /api/residents/:residentId
 * Soft Delete Resident (Preserves financial history)
 */
const deleteResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const residentId = req.params.residentId || req.params.id;

    await residentService.softDeleteResident(residentId, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Soft Deleted Successfully",
    });
  } catch (error) {
    logger.error("deleteResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Delete failed" });
  }
};

/**
 * PATCH /api/residents/:residentId/restore
 * Restore Soft Deleted Resident
 */
const restoreResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const residentId = req.params.residentId || req.params.id;

    const resident = await residentService.restoreResident(residentId, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Restored Successfully",
      resident,
    });
  } catch (error) {
    logger.error("restoreResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Restore failed" });
  }
};

/**
 * PATCH /api/residents/checkin
 * Check-In Workflow
 */
const checkInResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = checkInSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const resident = await residentService.checkInResident(value, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Checked In Successfully",
      resident,
    });
  } catch (error) {
    logger.error("checkInResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Check-in failed" });
  }
};

/**
 * PATCH /api/residents/checkout (or legacy checkoutResident)
 * Check-Out Workflow
 */
const checkoutResident = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const residentId = req.body.residentId || req.params.residentId || req.params.id;

    const { error, value } = checkOutSchema.validate({
      residentId,
      actualCheckoutDate: req.body.actualCheckoutDate,
      remarks: req.body.remarks,
    });
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const resident = await residentService.checkOutResident(value, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Checked Out Successfully",
      resident,
    });
  } catch (error) {
    logger.error("checkoutResident error:", error);
    return res.status(400).json({ success: false, message: error.message || "Check-out failed" });
  }
};

/**
 * PATCH /api/residents/transfer-room & transfer-bed
 */
const transferRoomOrBed = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const payload = {
      residentId: req.body.residentId,
      newRoomId: req.body.newRoomId || req.body.roomId,
      newBedId: req.body.newBedId || req.body.bedId,
      reason: req.body.reason,
    };

    const { error, value } = transferSchema.validate(payload);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const resident = await residentService.transferRoomOrBed(value, userCtx);

    return res.status(200).json({
      success: true,
      message: "Resident Transferred Successfully",
      resident,
    });
  } catch (error) {
    logger.error("transferRoomOrBed error:", error);
    return res.status(400).json({ success: false, message: error.message || "Transfer failed" });
  }
};

/**
 * PATCH /api/residents/status
 */
const changeStatus = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = statusSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const resident = await residentService.changeResidentStatus(value, userCtx);

    return res.status(200).json({
      success: true,
      message: `Status Changed to ${value.newStatus}`,
      resident,
    });
  } catch (error) {
    logger.error("changeStatus error:", error);
    return res.status(400).json({ success: false, message: error.message || "Status change failed" });
  }
};

/**
 * GET /api/residents/export/csv
 */
const exportResidentsCSV = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const result = await residentService.getResidentsList({
      hostelId: userCtx.hostelId,
      limit: 10000,
    });

    let csv = "Admission No,Full Name,Phone,Gender,Occupation,Status,Monthly Rent,Joining Date\n";
    result.residents.forEach((r) => {
      csv += `"${r.admissionNumber}","${r.fullName || r.name}","${r.phone}","${r.gender}","${r.occupation}","${r.status}",${r.monthlyRent},"${new Date(r.joiningDate || r.createdAt).toLocaleDateString()}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Residents_Export.csv");
    return res.send(csv);
  } catch (error) {
    logger.error("exportResidentsCSV error:", error);
    return res.status(500).json({ success: false, message: error.message || "Export error" });
  }
};

module.exports = {
  createResident,
  getResidentsByHostel,
  getResidentStatistics,
  searchResidents,
  getSingleResident,
  updateResident,
  deleteResident,
  restoreResident,
  checkInResident,
  checkoutResident,
  transferRoomOrBed,
  changeStatus,
  exportResidentsCSV,
};
