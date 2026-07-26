const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");
const {
  createShift,
  getShifts,
  getShiftById,
  updateShift,
  deleteShift,
  assignShift,
  getStaffCurrentShift,
} = require("../controllers/shiftController");

router.get("/me", auth, getStaffCurrentShift);
router.post("/assign", ownerAuth, rolePermissionMiddleware("staff", "edit"), assignShift);

router.post("/", ownerAuth, rolePermissionMiddleware("staff", "create"), createShift);
router.get("/", auth, getShifts);
router.get("/:id", auth, getShiftById);
router.put("/:id", ownerAuth, rolePermissionMiddleware("staff", "edit"), updateShift);
router.delete("/:id", ownerAuth, rolePermissionMiddleware("staff", "delete"), deleteShift);

module.exports = router;
