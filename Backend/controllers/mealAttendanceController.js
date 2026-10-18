const attendanceService = require("../services/mealAttendanceService");
const { recordAttendanceSchema } = require("../validations/foodValidation");
const { logger } = require("../utils/logger");

function getUserContext(req) {
  return {
    hostelId: req.context?.hostelId || req.owner?.hostelId || req.user?.hostelId,
    userId: req.context?.userId || req.owner?.ownerId || req.user?.userId || req.user?.id,
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
    if (!userCtx.hostelId) return res.status(400).json({ success: false, message: "Hostel context is required" });
    if (req.query.date && Number.isNaN(new Date(req.query.date).getTime())) {
      return res.status(400).json({ success: false, message: "Invalid attendance date" });
    }
    if (req.query.meal && !["Breakfast", "Lunch", "Snacks", "Dinner"].includes(req.query.meal)) {
      return res.status(400).json({ success: false, message: "Invalid meal period" });
    }
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
