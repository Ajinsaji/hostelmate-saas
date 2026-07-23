const { body } = require('express-validator');

const adminLoginValidation = [
  body('email').trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password').trim().notEmpty().withMessage('Password is required'),
];

module.exports = {
  adminLoginValidation,
};