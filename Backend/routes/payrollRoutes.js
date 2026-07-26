const express = require("express");
const router = express.Router();
const ownerAuth = require("../middleware/ownerAuth");
const { auth } = require("../middleware/auth");
const rolePermissionMiddleware = require("../middleware/rolePermissionMiddleware");

const {
  createSalaryStructure,
  getSalaryStructure,
} = require("../controllers/salaryStructureController");

const {
  requestAdvance,
  getAdvances,
  approveAdvance,
  rejectAdvance,
} = require("../controllers/salaryAdvanceController");

const {
  generatePayroll,
  getPayroll,
  getPayrollById,
  approvePayroll,
  lockPayroll,
  paySalary,
  getMyPayroll,
  downloadPayslip,
  getPolicy,
  updatePolicy,
  createAdjustment,
} = require("../controllers/payrollController");

// Self Service Routes (Staff)
router.get("/me", auth, getMyPayroll);
router.get("/me/payslips", auth, getMyPayroll);
router.post("/advance", auth, requestAdvance);

// Salary Structure Routes
router.post("/salary-structure", ownerAuth, rolePermissionMiddleware("payroll", "process"), createSalaryStructure);
router.get("/salary-structure", auth, rolePermissionMiddleware("payroll", "view"), getSalaryStructure);

// Policy & Adjustments
router.get("/policy", auth, rolePermissionMiddleware("payroll", "view"), getPolicy);
router.put("/policy", ownerAuth, rolePermissionMiddleware("payroll", "process"), updatePolicy);
router.post("/adjustment", auth, rolePermissionMiddleware("payroll", "process"), createAdjustment);

// Payroll Processing Routes
router.post("/process", auth, rolePermissionMiddleware("payroll", "process"), generatePayroll);
router.get("/", auth, rolePermissionMiddleware("payroll", "view"), getPayroll);
router.get("/history", auth, rolePermissionMiddleware("payroll", "view"), getPayroll);

// Salary Advance Management
router.get("/advance", auth, rolePermissionMiddleware("payroll", "view"), getAdvances);
router.patch("/advance/:id/approve", ownerAuth, rolePermissionMiddleware("payroll", "process"), approveAdvance);
router.patch("/advance/:id/reject", ownerAuth, rolePermissionMiddleware("payroll", "process"), rejectAdvance);

// Single Record Action Routes (Must come after named routes)
router.get("/payslip/:id", auth, downloadPayslip);
router.get("/:id", auth, rolePermissionMiddleware("payroll", "view"), getPayrollById);
router.patch("/:id/approve", auth, rolePermissionMiddleware("payroll", "process"), approvePayroll);
router.patch("/:id/lock", ownerAuth, rolePermissionMiddleware("payroll", "process"), lockPayroll);
router.patch("/:id/pay", auth, rolePermissionMiddleware("payroll", "process"), paySalary);

module.exports = router;
