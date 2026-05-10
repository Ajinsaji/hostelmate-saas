const Admin = require("../models/Admin");

const loginAdmin = async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({
      username,
      password,
    });

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    res.status(200).json({
      success: true,
      message: "Login Success",
      admin,
    });
  } catch (error) {
    res.status(500).json(error);
  }
};

module.exports = {
  loginAdmin,
};