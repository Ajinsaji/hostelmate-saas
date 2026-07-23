const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

const loginAdmin = async (req, res) => {
  try {
    const { logger } = require("../utils/logger");
    const { username, email, password } = req.body;

    if (!password || (!username && !email)) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    // Find admin by username OR email (do not include password in the query)
    const admin = await Admin.findOne({
      $or: [{ username }, { email }],
    });

    if (!admin) {
      logger.warn({ username, email }, "Admin login failed: Admin not found");
      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // STRICT BCRYPT CHECK - NO PLAINTEXT FALLBACK
    const bcrypt = require("bcryptjs");
    let isMatch = false;

    if (admin.password) {
      isMatch = await bcrypt.compare(password, admin.password);
    }

    if (!isMatch) {
      logger.warn({ username, email }, "Admin login failed: Password mismatch");
      
      // Track Failed Login
      const AuditLog = require("../models/AuditLog");
      await AuditLog.create({
        adminId: admin._id,
        action: "FAILED_LOGIN",
        details: "Invalid password attempt",
        ipAddress: req.ip || req.connection.remoteAddress,
        timestamp: new Date()
      });

      return res.status(400).json({
        success: false,
        message: "Invalid Credentials",
      });
    }

    // Track successful login
    admin.lastLogin = new Date();
    admin.loginHistory.push({
      ip: req.ip || req.connection.remoteAddress,
      location: "Unknown",
      device: req.headers["user-agent"] || "Unknown Device",
      time: new Date(),
      status: "SUCCESS"
    });
    // Keep max 50 history entries
    if (admin.loginHistory.length > 50) admin.loginHistory.shift();
    await admin.save();

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
    logger.info(error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Internal Server Error",
    });
  }
};

module.exports = {
  loginAdmin,
};
