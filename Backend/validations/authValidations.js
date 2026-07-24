const { body } = require('express-validator');

const adminLoginValidation = [
  body('email').optional().trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('username').optional().trim(),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

module.exports = {
  adminLoginValidation,
};