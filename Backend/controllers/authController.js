const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const loginAdmin = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    console.log("========== ADMIN LOGIN ATTEMPT ==========");
    console.log("USERNAME:", username);
    console.log("EMAIL:", email);

    // Find admin by username OR email (do not include password in the query)
    const admin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    console.log("ADMIN FOUND:", admin ? {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role
    } : null);

    console.log("PASSWORD HASH EXISTS:", !!admin?.password);

    if (!admin) {
      console.log("INVALID CREDENTIALS REASON");
      console.log("REASON: ADMIN NOT FOUND");
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // Password comparison (supports BOTH plaintext and bcrypt-hashed passwords)
    const storedPassword = admin.password;
    let isMatch = false;

    // bcrypt hashes typically start with $2a/$2b/$2y
    const looksLikeBcrypt =
      typeof storedPassword === "string" && /^\$2[aby]\$/.test(storedPassword);

    if (looksLikeBcrypt) {
      const bcrypt = require("bcryptjs");
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      // plaintext fallback (for legacy admin records)
      isMatch = password === storedPassword;
    }

    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      console.log("INVALID CREDENTIALS REASON");
      if (admin && !isMatch) {
        console.log("REASON: PASSWORD MISMATCH");
      }
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server misconfigured: JWT_SECRET missing",
      });
    }

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