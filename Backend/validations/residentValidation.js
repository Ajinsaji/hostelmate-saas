const Joi = require("joi");

const createResidentSchema = Joi.object({
  firstName: Joi.string().trim().required(),
  lastName: Joi.string().trim().allow("", null),
  fullName: Joi.string().trim().allow("", null),
  gender: Joi.string().valid("Male", "Female", "Other", "male", "female", "other").default("Male"),
  dateOfBirth: Joi.date().allow(null),
  dob: Joi.date().allow(null),
  phone: Joi.string().trim().required(),
  email: Joi.string().email().allow("", null),
  photo: Joi.string().allow("", null),
  aadhaarNumber: Joi.string().trim().allow("", null),
  passportNumber: Joi.string().trim().allow("", null),
  guardianName: Joi.string().allow("", null),
  guardianRelation: Joi.string().allow("", null),
  guardianPhone: Joi.string().allow("", null),
  emergencyContactName: Joi.string().allow("", null),
  emergencyContactPhone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  city: Joi.string().allow("", null),
  state: Joi.string().allow("", null),
  country: Joi.string().allow("", null),
  pincode: Joi.string().allow("", null),
  occupation: Joi.string().valid("Student", "Working Professional", "Self-Employed", "Other").default("Student"),
  company: Joi.string().allow("", null),
  college: Joi.string().allow("", null),
  joiningDate: Joi.date().default(Date.now),
  expectedCheckoutDate: Joi.date().allow(null),
  securityDeposit: Joi.number().min(0).default(0),
  monthlyRent: Joi.number().min(0).required(),
  advancePaid: Joi.number().min(0).default(0),
  paymentDay: Joi.number().min(1).max(31).default(1),
  foodPreference: Joi.string().valid("Veg", "Non-Veg", "Jain", "None").default("Veg"),
  bloodGroup: Joi.string().allow("", null),
  medicalConditions: Joi.string().allow("", null),
  remarks: Joi.string().allow("", null),
  status: Joi.string().valid("Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked").default("Pending Admission"),
  roomId: Joi.string().allow("", null),
  bedId: Joi.string().allow("", null),
});

const updateResidentSchema = Joi.object({
  firstName: Joi.string().trim(),
  lastName: Joi.string().trim().allow("", null),
  fullName: Joi.string().trim(),
  gender: Joi.string().valid("Male", "Female", "Other", "male", "female", "other"),
  dateOfBirth: Joi.date().allow(null),
  dob: Joi.date().allow(null),
  phone: Joi.string().trim(),
  email: Joi.string().email().allow("", null),
  photo: Joi.string().allow("", null),
  aadhaarNumber: Joi.string().trim().allow("", null),
  passportNumber: Joi.string().trim().allow("", null),
  guardianName: Joi.string().allow("", null),
  guardianRelation: Joi.string().allow("", null),
  guardianPhone: Joi.string().allow("", null),
  emergencyContactName: Joi.string().allow("", null),
  emergencyContactPhone: Joi.string().allow("", null),
  address: Joi.string().allow("", null),
  city: Joi.string().allow("", null),
  state: Joi.string().allow("", null),
  country: Joi.string().allow("", null),
  pincode: Joi.string().allow("", null),
  occupation: Joi.string().valid("Student", "Working Professional", "Self-Employed", "Other"),
  company: Joi.string().allow("", null),
  college: Joi.string().allow("", null),
  joiningDate: Joi.date(),
  expectedCheckoutDate: Joi.date().allow(null),
  securityDeposit: Joi.number().min(0),
  monthlyRent: Joi.number().min(0),
  advancePaid: Joi.number().min(0),
  paymentDay: Joi.number().min(1).max(31),
  foodPreference: Joi.string().valid("Veg", "Non-Veg", "Jain", "None"),
  bloodGroup: Joi.string().allow("", null),
  medicalConditions: Joi.string().allow("", null),
  remarks: Joi.string().allow("", null),
  status: Joi.string().valid("Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked"),
});

const checkInSchema = Joi.object({
  residentId: Joi.string().required(),
  roomId: Joi.string().required(),
  bedId: Joi.string().required(),
  checkInDate: Joi.date().default(Date.now),
});

const checkOutSchema = Joi.object({
  residentId: Joi.string().required(),
  actualCheckoutDate: Joi.date().default(Date.now),
  remarks: Joi.string().allow("", null),
});

const transferSchema = Joi.object({
  residentId: Joi.string().required(),
  newRoomId: Joi.string().required(),
  newBedId: Joi.string().required(),
  reason: Joi.string().allow("", null),
});

const statusSchema = Joi.object({
  residentId: Joi.string().required(),
  newStatus: Joi.string().valid("Pending Admission", "Active", "Notice Period", "Checked Out", "Blocked").required(),
  reason: Joi.string().allow("", null),
});

module.exports = {
  createResidentSchema,
  updateResidentSchema,
  checkInSchema,
  checkOutSchema,
  transferSchema,
  statusSchema,
};
