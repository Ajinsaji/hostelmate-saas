const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { uploadFields } = require("../middleware/cloudinaryUpload");
const {
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
} = require("../controllers/residentController");

const residentUploads = uploadFields([
  { name: "photo", maxCount: 1 },
  { name: "idProof", maxCount: 1 },
  { name: "signatureFile", maxCount: 1 },
]);

// Special Endpoints (Must be registered BEFORE /:residentId)
router.get("/statistics", ownerAuth, getResidentStatistics);
router.get("/search", ownerAuth, searchResidents);
router.get("/export/csv", ownerAuth, exportResidentsCSV);

// Workflow Patch Operations
router.patch("/checkin", ownerAuth, checkInResident);
router.patch("/checkout", ownerAuth, checkoutResident);
router.patch("/transfer-room", ownerAuth, transferRoomOrBed);
router.patch("/transfer-bed", ownerAuth, transferRoomOrBed);
router.patch("/status", ownerAuth, changeStatus);

// Creation
router.post("/", ownerAuth, residentUploads, createResident);
router.post("/create", ownerAuth, residentUploads, createResident); // Legacy Alias

// Listing
router.get("/", ownerAuth, getResidentsByHostel);
router.get("/hostel", ownerAuth, getResidentsByHostel); // Legacy Alias

// Single Resident Details, Updates, Deletion, Restoration
router.get("/single/:residentId", ownerAuth, getSingleResident); // Legacy Alias
router.get("/:residentId", ownerAuth, getSingleResident);

router.put("/update/:residentId", ownerAuth, residentUploads, updateResident); // Legacy Alias
router.put("/:residentId", ownerAuth, residentUploads, updateResident);

router.delete("/delete/:residentId", ownerAuth, deleteResident); // Legacy Alias
router.delete("/:residentId", ownerAuth, deleteResident);

router.patch("/:residentId/restore", ownerAuth, restoreResident);

module.exports = router;
