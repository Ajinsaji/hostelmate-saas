const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const { downloadReport } = require("../controllers/reportController");

router.get("/executive", auth, (req, res) => downloadReport({ ...req, params: { reportType: "executive" } }, res));
router.get("/financial", auth, (req, res) => downloadReport({ ...req, params: { reportType: "financial" } }, res));
router.get("/payroll", auth, (req, res) => downloadReport({ ...req, params: { reportType: "payroll" } }, res));
router.get("/occupancy", auth, (req, res) => downloadReport({ ...req, params: { reportType: "occupancy" } }, res));
router.get("/food", auth, (req, res) => downloadReport({ ...req, params: { reportType: "food" } }, res));
router.get("/vendors", auth, (req, res) => downloadReport({ ...req, params: { reportType: "vendors" } }, res));
router.get("/treasury", auth, (req, res) => downloadReport({ ...req, params: { reportType: "treasury" } }, res));

module.exports = router;
