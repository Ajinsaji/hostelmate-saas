const Attendance = require("../models/Attendance");
const AttendanceCorrection = require("../models/AttendanceCorrection");
const Holiday = require("../models/Holiday");
const Staff = require("../models/Staff");
const AuditLog = require("../models/AuditLog");
const { getStaffCurrentShift } = require("./shiftService");
const { logger } = require("../utils/logger");
const { publishNotification } = require("../utils/notificationPublisher");

const parseTimeToToday = (timeStr, baseDate = new Date()) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d;
};

const calculateLateMinutes = (checkInDate, shiftStartTimeStr) => {
  if (!checkInDate || !shiftStartTimeStr) return 0;
  const shiftStart = parseTimeToToday(shiftStartTimeStr, checkInDate);
  // 15-minute grace period
  const graceStart = new Date(shiftStart.getTime() + 15 * 60 * 1000);
  if (checkInDate > graceStart) {
    return Math.round((checkInDate.getTime() - shiftStart.getTime()) / (60 * 1000));
  }
  return 0;
};

const calculateWorkingHours = (checkIn, checkOut, breakDurationMinutes = 30) => {
  if (!checkIn || !checkOut) return 0;
  const diffMs = checkOut.getTime() - checkIn.getTime();
  const totalHours = diffMs / (1000 * 60 * 60);
  const breakHours = breakDurationMinutes / 60;
  return Math.max(Number((totalHours - breakHours).toFixed(2)), 0);
};

const checkIn = async (tenantId, hostelId, staffId, checkInData, userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let record = await Attendance.findOne({
    tenantId,
    staffId,
    attendanceDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
  });

  if (record && record.checkIn) {
    throw { statusCode: 400, message: "Staff member has already checked in for today" };
  }

  const shift = await getStaffCurrentShift(tenantId, staffId, new Date());
  const now = new Date();
  const lateMinutes = shift ? calculateLateMinutes(now, shift.startTime) : 0;
  const status = lateMinutes > 0 ? "Late" : "Present";

  if (!record) {
    record = new Attendance({
      tenantId,
      hostelId,
      staffId,
      attendanceDate: today,
      shiftId: shift ? shift._id : null,
    });
  }

  record.checkIn = now;
  record.attendanceStatus = status;
  record.lateMinutes = lateMinutes;
  record.attendanceSource = checkInData.attendanceSource || "Web";
  record.markedBy = userId;
  record.location = checkInData.location || { latitude: null, longitude: null, address: "" };
  record.deviceInfo = checkInData.deviceInfo || "";
  record.ipAddress = checkInData.ipAddress || "";
  record.remarks = checkInData.remarks || "";

  await record.save();

  await AuditLog.create({
    hostelId,
    userId,
    action: "Staff Check-In",
    actionType: "CREATE",
    entity: "Attendance",
    targetId: record._id,
    targetModel: "Attendance",
    details: { staffId, status, lateMinutes, source: record.attendanceSource },
  });

  return record;
};

const checkOut = async (tenantId, hostelId, staffId, checkOutData, userId) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const record = await Attendance.findOne({
    tenantId,
    staffId,
    attendanceDate: { $gte: today, $lt: new Date(today.getTime() + 86400000) },
  }).populate("shiftId");

  if (!record || !record.checkIn) {
    throw { statusCode: 400, message: "Staff member has not checked in today" };
  }

  if (record.checkOut) {
    throw { statusCode: 400, message: "Staff member has already checked out for today" };
  }

  const now = new Date();
  const breakMins = record.shiftId ? record.shiftId.breakDuration : 30;
  const shiftWorkingHours = record.shiftId ? record.shiftId.workingHours : 8;

  const totalWorked = calculateWorkingHours(record.checkIn, now, breakMins);
  const overtimeHours = Math.max(Number((totalWorked - shiftWorkingHours).toFixed(2)), 0);

  record.checkOut = now;
  record.workingHours = totalWorked;
  record.overtimeHours = overtimeHours;
  if (checkOutData.remarks) record.remarks = checkOutData.remarks;

  await record.save();

  // If overtime worked, create OvertimeRequest automatically
  if (overtimeHours > 0) {
    try {
      const OvertimeRequest = require("../models/OvertimeRequest");
      await OvertimeRequest.create({
        tenantId,
        hostelId,
        staffId,
        attendanceId: record._id,
        hours: overtimeHours,
        reason: `Automated shift overtime check-out (${overtimeHours} hrs)`,
        status: "Pending",
      });
    } catch (e) {
      logger.error("Auto overtime request creation error:", e?.message);
    }
  }

  await AuditLog.create({
    hostelId,
    userId,
    action: "Staff Check-Out",
    actionType: "UPDATE",
    entity: "Attendance",
    targetId: record._id,
    targetModel: "Attendance",
    details: { staffId, workingHours: totalWorked, overtimeHours },
  });

  return record;
};

const getAttendanceSummary = async (tenantId, hostelId, date = new Date()) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  const nextDate = new Date(targetDate.getTime() + 86400000);

  const totalStaffCount = await Staff.countDocuments({ tenantId, isDeleted: false, employmentStatus: "Active" });

  const records = await Attendance.find({
    tenantId,
    attendanceDate: { $gte: targetDate, $lt: nextDate },
  }).populate({ path: "staffId", select: "fullName employeeCode photo" });

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let onLeaveCount = 0;
  let onDutyCount = 0;
  let totalOvertimeHours = 0;

  records.forEach((r) => {
    if (r.attendanceStatus === "Present") presentCount++;
    else if (r.attendanceStatus === "Late") {
      lateCount++;
      presentCount++;
    } else if (r.attendanceStatus === "Leave") onLeaveCount++;
    else if (r.attendanceStatus === "Absent") absentCount++;

    if (r.checkIn && !r.checkOut) onDutyCount++;
    if (r.overtimeHours) totalOvertimeHours += r.overtimeHours;
  });

  const markedStaffIds = records.map((r) => r.staffId?._id?.toString());
  const unMarkedCount = Math.max(totalStaffCount - markedStaffIds.length, 0);
  absentCount += unMarkedCount;

  const attendancePercentage = totalStaffCount > 0 ? Math.round((presentCount / totalStaffCount) * 100) : 0;

  return {
    totalStaff: totalStaffCount,
    present: presentCount,
    absent: absentCount,
    late: lateCount,
    onLeave: onLeaveCount,
    onDuty: onDutyCount,
    attendancePercentage,
    totalOvertimeHours,
    records,
  };
};

const getAttendanceCalendar = async (tenantId, staffId, year, month) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const records = await Attendance.find({
    tenantId,
    staffId,
    attendanceDate: { $gte: startDate, $lte: endDate },
  }).populate("shiftId");

  return records;
};

const submitAttendanceCorrection = async (tenantId, hostelId, staffId, correctionData) => {
  const { attendanceId, requestedCheckIn, requestedCheckOut, reason } = correctionData;

  const attendance = await Attendance.findOne({ _id: attendanceId, tenantId });
  if (!attendance) {
    throw { statusCode: 404, message: "Attendance record not found" };
  }

  const correction = await AttendanceCorrection.create({
    tenantId,
    attendanceId,
    staffId,
    requestedCheckIn: new Date(requestedCheckIn),
    requestedCheckOut: new Date(requestedCheckOut),
    reason,
    status: "Pending",
  });

  await AuditLog.create({
    hostelId,
    userId: staffId,
    action: "Attendance Correction Requested",
    actionType: "CREATE",
    entity: "AttendanceCorrection",
    targetId: correction._id,
    targetModel: "AttendanceCorrection",
    details: { reason },
  });

  return correction;
};

const approveAttendanceCorrection = async (tenantId, correctionId, approvedBy) => {
  const correction = await AttendanceCorrection.findOne({ _id: correctionId, tenantId });
  if (!correction) {
    throw { statusCode: 404, message: "Attendance correction request not found" };
  }

  correction.status = "Approved";
  correction.approvedBy = approvedBy;
  correction.approvedAt = new Date();
  await correction.save();

  const attendance = await Attendance.findById(correction.attendanceId).populate("shiftId");
  if (attendance) {
    attendance.checkIn = correction.requestedCheckIn;
    attendance.checkOut = correction.requestedCheckOut;

    const breakMins = attendance.shiftId ? attendance.shiftId.breakDuration : 30;
    const worked = calculateWorkingHours(correction.requestedCheckIn, correction.requestedCheckOut, breakMins);
    attendance.workingHours = worked;
    attendance.attendanceStatus = "Present";
    await attendance.save();
  }

  await AuditLog.create({
    hostelId: attendance?.hostelId,
    userId: approvedBy,
    action: "Attendance Correction Approved",
    actionType: "UPDATE",
    entity: "AttendanceCorrection",
    targetId: correction._id,
    targetModel: "AttendanceCorrection",
  });

  return correction;
};

const rejectAttendanceCorrection = async (tenantId, correctionId, rejectedBy) => {
  const correction = await AttendanceCorrection.findOne({ _id: correctionId, tenantId });
  if (!correction) {
    throw { statusCode: 404, message: "Attendance correction request not found" };
  }

  correction.status = "Rejected";
  correction.approvedBy = rejectedBy;
  correction.approvedAt = new Date();
  await correction.save();

  return correction;
};

const getAttendanceCorrections = async (tenantId, filters = {}) => {
  const query = { tenantId };
  if (filters.status) query.status = filters.status;
  if (filters.staffId) query.staffId = filters.staffId;

  return AttendanceCorrection.find(query)
    .populate({ path: "staffId", select: "fullName employeeCode photo" })
    .populate("attendanceId")
    .sort({ createdAt: -1 });
};

module.exports = {
  checkIn,
  checkOut,
  calculateWorkingHours,
  calculateLateMinutes,
  getAttendanceSummary,
  getAttendanceCalendar,
  submitAttendanceCorrection,
  approveAttendanceCorrection,
  rejectAttendanceCorrection,
  getAttendanceCorrections,
};
