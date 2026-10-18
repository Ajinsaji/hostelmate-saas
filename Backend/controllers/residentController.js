const residentService = require("../services/residentService");
const getUploadedFileUrl = require("../utils/getUploadedFileUrl");
const { logger } = require("../utils/logger");
const BusinessRuleEngine = require("../services/BusinessRuleEngine");
const EventBus = require("../services/EventBus");
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
    hostelId: req.context?.hostelId || req.owner?.hostelId || req.user?.hostelId,
    workspaceId: req.context?.workspaceId || req.owner?.workspaceId,
    userId: req.context?.userId || req.owner?.ownerId || req.owner?._id || req.user?._id || req.user?.userId,
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

    const workspaceId = req.context?.workspaceId;

    // 1. Quota check via BusinessRuleEngine
    const quotaCheck = await BusinessRuleEngine.canCreateResident(workspaceId);
    if (!quotaCheck.allowed) {
      return res.status(403).json({ success: false, message: quotaCheck.message });
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

    // 2. Room allocation check via BusinessRuleEngine
    if (value.roomId) {
      const roomCheck = await BusinessRuleEngine.canAllocateRoom(value.roomId);
      if (!roomCheck.allowed) {
        return res.status(400).json({ success: false, message: roomCheck.message });
      }
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

    // 3. Emit RESIDENT_CREATED event
    EventBus.emit("RESIDENT_CREATED", {
      workspaceId,
      hostelId: userCtx.hostelId,
      ownerId: userCtx.userId,
      residentId: resident._id,
      name: resident.name,
      roomNumber: value.roomNumber,
    });

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

const residentCsvService = require("../services/residentCsvService");

/**
 * GET /api/residents/import/template
 */
const getResidentCsvTemplate = (req, res) => {
  try {
    const csv = residentCsvService.getCsvTemplate();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Resident_Import_Template.csv");
    return res.status(200).send(csv);
  } catch (err) {
    logger.error("getResidentCsvTemplate error:", err);
    return res.status(500).json({ success: false, message: "Failed to generate CSV template" });
  }
};

/**
 * POST /api/residents/import/preview
 */
const previewResidentCsv = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    let rows = [];
    if (req.file) {
      const csvText = req.file.buffer ? req.file.buffer.toString("utf8") : "";
      rows = await residentCsvService.parseCsvString(csvText);
    } else if (req.body.csvText) {
      rows = await residentCsvService.parseCsvString(req.body.csvText);
    } else if (Array.isArray(req.body.rows)) {
      rows = req.body.rows;
    } else {
      return res.status(400).json({ success: false, message: "No CSV file or data provided" });
    }

    const preview = await residentCsvService.previewResidentsImport(rows, userCtx);
    return res.status(200).json({ success: true, ...preview });
  } catch (err) {
    logger.error("previewResidentCsv error:", err);
    return res.status(400).json({ success: false, message: err.message || "Preview failed" });
  }
};

/**
 * POST /api/residents/import/commit
 */
const commitResidentCsv = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const rows = req.body.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: "No rows provided to commit" });
    }

    const result = await residentCsvService.commitResidentsImport(rows, userCtx);
    return res.status(201).json({
      success: true,
      message: `Successfully imported ${result.importedCount} resident(s)`,
      ...result,
    });
  } catch (err) {
    logger.error("commitResidentCsv error:", err);
    return res.status(400).json({ success: false, message: err.message || "Import commit failed" });
  }
};

/**
 * GET /api/residents/export/csv
 */
const exportResidentsCSV = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const csv = await residentCsvService.exportResidentsToCsv({
      hostelId: userCtx.hostelId,
      status: req.query.status,
      roomId: req.query.roomId,
      search: req.query.search,
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=Residents_Export.csv");
    return res.status(200).send(csv);
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
  getResidentCsvTemplate,
  previewResidentCsv,
  commitResidentCsv,
  exportResidentsCSV,
};
