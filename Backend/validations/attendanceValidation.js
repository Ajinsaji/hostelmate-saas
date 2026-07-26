const Joi = require("joi");

const createShiftSchema = Joi.object({
  shiftCode: Joi.string().trim().required(),
  shiftName: Joi.string().valid("Morning", "Evening", "Night", "General").required(),
  startTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
  endTime: Joi.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).required(),
  breakDuration: Joi.number().min(0).default(30),
  workingHours: Joi.number().min(1).default(8),
  weeklyOff: Joi.string().default("Sunday"),
  color: Joi.string().default("#10b981"),
  hostelId: Joi.string().allow("", null),
});

const assignShiftSchema = Joi.object({
  staffId: Joi.string().required(),
  shiftId: Joi.string().required(),
  effectiveFrom: Joi.date().required(),
  effectiveTo: Joi.date().allow("", null),
  rotationType: Joi.string().valid("Fixed", "Weekly", "Monthly").default("Fixed"),
});

const checkInSchema = Joi.object({
  attendanceSource: Joi.string().valid("Manual", "Web", "Mobile", "QR Code", "Biometric", "Face Recognition").default("Web"),
  location: Joi.object({
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    address: Joi.string().allow("", null),
  }).optional(),
  deviceInfo: Joi.string().allow("", null),
  ipAddress: Joi.string().allow("", null),
  remarks: Joi.string().allow("", null),
});

const checkOutSchema = Joi.object({
  location: Joi.object({
    latitude: Joi.number().allow(null),
    longitude: Joi.number().allow(null),
    address: Joi.string().allow("", null),
  }).optional(),
  remarks: Joi.string().allow("", null),
});

const leaveRequestSchema = Joi.object({
  leaveTypeId: Joi.string().required(),
  fromDate: Joi.date().required(),
  toDate: Joi.date().required(),
  reason: Joi.string().trim().required(),
});

const attendanceCorrectionSchema = Joi.object({
  attendanceId: Joi.string().required(),
  requestedCheckIn: Joi.date().required(),
  requestedCheckOut: Joi.date().required(),
  reason: Joi.string().trim().required(),
});

const overtimeRequestSchema = Joi.object({
  attendanceId: Joi.string().required(),
  hours: Joi.number().min(0.5).max(12).required(),
  reason: Joi.string().trim().required(),
});

module.exports = {
  createShiftSchema,
  assignShiftSchema,
  checkInSchema,
  checkOutSchema,
  leaveRequestSchema,
  attendanceCorrectionSchema,
  overtimeRequestSchema,
};
