const attendanceService = require("../services/mealAttendanceService");
const { recordAttendanceSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.owner?.hostelId || req.user?.hostelId,
    userId: req.owner?._id || req.user?._id,
    ip: req.ip || req.headers["x-forwarded-for"] || "",
  };
}

const recordAttendance = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const { error, value } = recordAttendanceSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const attendance = await attendanceService.recordMealAttendance(value, userCtx);
    return res.status(201).json({ success: true, message: "Meal Attendance Recorded", attendance });
  } catch (err) {
    logger.error("recordAttendance error:", err);
    return res.status(400).json({ success: false, message: err.message || "Failed to record attendance" });
  }
};

const getAttendance = async (req, res) => {
  try {
    const userCtx = getUserContext(req);
    const list = await attendanceService.getAttendanceForDate(userCtx.hostelId, req.query.date, req.query.meal);
    return res.status(200).json({ success: true, attendance: list });
  } catch (err) {
    logger.error("getAttendance error:", err);
    return res.status(500).json({ success: false, message: err.message || "Server Error" });
  }
};

module.exports = {
  recordAttendance,
  getAttendance,
};
