const express = require("express");

const router = express.Router();

const { loginAdmin } = require("../controllers/authController");

const { validate } = require('../middleware/validate');
const { adminLoginValidation } = require('../validations/authValidations');
router.post('/login', adminLoginValidation, validate, loginAdmin);

module.exports = router;
