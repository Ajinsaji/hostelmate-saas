const Joi = require("joi");

const createStaffSchema = Joi.object({
  fullName: Joi.string().trim().min(2).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().trim().min(8).max(15).required(),
  role: Joi.string().valid("Owner", "Warden", "Cook", "Accountant", "owner", "warden", "cook", "accountant").required(),
  designation: Joi.string().trim().required(),
  salary: Joi.number().min(0).default(0),
  joiningDate: Joi.date().allow("", null),
  address: Joi.string().allow("", null),
  photo: Joi.string().allow("", null),
  password: Joi.string().min(6).required(),
  confirmPassword: Joi.string().valid(Joi.ref("password")).allow("", null),
  hostelId: Joi.string().allow("", null),
});

const updateStaffSchema = Joi.object({
  fullName: Joi.string().trim().min(2).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().trim().min(8).max(15).optional(),
  role: Joi.string().valid("Owner", "Warden", "Cook", "Accountant", "owner", "warden", "cook", "accountant").optional(),
  designation: Joi.string().trim().optional(),
  salary: Joi.number().min(0).optional(),
  joiningDate: Joi.date().allow("", null).optional(),
  address: Joi.string().allow("", null).optional(),
  photo: Joi.string().allow("", null).optional(),
  status: Joi.string().valid("Active", "Inactive").optional(),
  hostelId: Joi.string().allow("", null).optional(),
});

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
});

const changeSelfPasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});

module.exports = {
  createStaffSchema,
  updateStaffSchema,
  resetPasswordSchema,
  changeSelfPasswordSchema,
};
