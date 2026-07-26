const attendanceService = require("../services/attendanceService");
const Staff = require("../models/Staff");
const Attendance = require("../models/Attendance");
const { logger } = require("../utils/logger");

const checkIn = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.user.hostelId || tenantId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff employment record not found" });
    }

    const record = await attendanceService.checkIn(tenantId, hostelId, staff._id, req.body, userId);
    return res.status(200).json({ success: true, message: "Check-in successful", attendance: record });
  } catch (error) {
    logger.error("CHECK IN ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Check-in failed" });
  }
};

const checkOut = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.user.hostelId || tenantId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff employment record not found" });
    }

    const record = await attendanceService.checkOut(tenantId, hostelId, staff._id, req.body, userId);
    return res.status(200).json({ success: true, message: "Check-out successful", attendance: record });
  } catch (error) {
    logger.error("CHECK OUT ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Check-out failed" });
  }
};

const getAttendance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { date, hostelId, staffId } = req.query;

    const summary = await attendanceService.getAttendanceSummary(tenantId, hostelId || tenantId, date);
    return res.status(200).json({ success: true, ...summary });
  } catch (error) {
    logger.error("GET ATTENDANCE ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load attendance" });
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const record = await Attendance.findOne({ _id: req.params.id, tenantId }).populate("staffId shiftId");
    if (!record) {
      return res.status(404).json({ success: false, message: "Attendance record not found" });
    }
    return res.status(200).json({ success: true, attendance: record });
  } catch (error) {
    logger.error("GET ATTENDANCE BY ID ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to fetch attendance record" });
  }
};

const getMyAttendance = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const userId = req.user.userId || req.user.id;
    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayRecord = await Attendance.findOne({
      tenantId,
      staffId: staff._id,
      attendanceDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
    }).populate("shiftId");

    const history = await Attendance.find({ tenantId, staffId: staff._id })
      .populate("shiftId")
      .sort({ attendanceDate: -1 })
      .limit(30);

    return res.status(200).json({ success: true, today: todayRecord, history });
  } catch (error) {
    logger.error("GET MY ATTENDANCE ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to load staff attendance history" });
  }
};

const getAttendanceSummary = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.query.hostelId || req.user.hostelId || tenantId;
    const date = req.query.date || new Date();

    const summary = await attendanceService.getAttendanceSummary(tenantId, hostelId, date);
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    logger.error("GET ATTENDANCE SUMMARY ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to generate attendance summary" });
  }
};

const getAttendanceCalendar = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { staffId, year, month } = req.query;

    const y = year ? Number(year) : new Date().getFullYear();
    const m = month ? Number(month) : new Date().getMonth() + 1;

    const records = await attendanceService.getAttendanceCalendar(tenantId, staffId, y, m);
    return res.status(200).json({ success: true, calendar: records });
  } catch (error) {
    logger.error("GET ATTENDANCE CALENDAR ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to fetch attendance calendar" });
  }
};

const submitAttendanceCorrection = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const hostelId = req.user.hostelId || tenantId;
    const userId = req.user.userId || req.user.id;

    const staff = await Staff.findOne({ userId, isDeleted: false });
    if (!staff) {
      return res.status(404).json({ success: false, message: "Staff record not found" });
    }

    const correction = await attendanceService.submitAttendanceCorrection(tenantId, hostelId, staff._id, req.body);
    return res.status(201).json({ success: true, message: "Attendance correction requested", correction });
  } catch (error) {
    logger.error("SUBMIT CORRECTION ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to submit correction" });
  }
};

const getAttendanceCorrections = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const { status, staffId } = req.query;
    const corrections = await attendanceService.getAttendanceCorrections(tenantId, { status, staffId });
    return res.status(200).json({ success: true, corrections });
  } catch (error) {
    logger.error("GET CORRECTIONS ERROR:", error?.message || error);
    return res.status(500).json({ success: false, message: "Unable to retrieve attendance corrections" });
  }
};

const approveAttendanceCorrection = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const approvedBy = req.user.userId || req.user.id;
    const correction = await attendanceService.approveAttendanceCorrection(tenantId, req.params.id, approvedBy);
    return res.status(200).json({ success: true, message: "Attendance correction approved", correction });
  } catch (error) {
    logger.error("APPROVE CORRECTION ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to approve correction" });
  }
};

const rejectAttendanceCorrection = async (req, res) => {
  try {
    const tenantId = req.user.tenantId || req.user.hostelId;
    const rejectedBy = req.user.userId || req.user.id;
    const correction = await attendanceService.rejectAttendanceCorrection(tenantId, req.params.id, rejectedBy);
    return res.status(200).json({ success: true, message: "Attendance correction rejected", correction });
  } catch (error) {
    logger.error("REJECT CORRECTION ERROR:", error?.message || error);
    const status = error.statusCode || 500;
    return res.status(status).json({ success: false, message: error.message || "Failed to reject correction" });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getAttendance,
  getAttendanceById,
  getMyAttendance,
  getAttendanceSummary,
  getAttendanceCalendar,
  submitAttendanceCorrection,
  getAttendanceCorrections,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
};
