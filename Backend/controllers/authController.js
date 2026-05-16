const jwt = require("jsonwebtoken");
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

    const secret = process.env.JWT_SECRET || "change_me_secret";
    const token = jwt.sign(
      {
        userId: admin._id,
        role: admin.role,
      },
      secret,
      { expiresIn: "7d" }
    );

    const { password: _, ...adminData } = admin.toObject();

    res.status(200).json({
      success: true,
      message: "Login Success",
      token,
      admin: adminData,
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