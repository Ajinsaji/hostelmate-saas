const jwt = require("jsonwebtoken");

const ownerAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Missing token",
      });
    }

    const secret = process.env.JWT_SECRET || "change_me_secret";

    const payload = jwt.verify(token, secret);

    if (!payload || payload.role !== "owner") {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    // Attach to req for downstream controllers
    req.owner = {
      ownerId: payload.ownerId,
      hostelId: payload.hostelId,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid/expired token",
    });
  }
};

module.exports = ownerAuth;

