const Admin = require("../models/Admin");

const loginAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const admin = await Admin.findOne({
      password,
      $or: [
        { username },
        { email },
      ],
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
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
};

module.exports = {
  loginAdmin,
};