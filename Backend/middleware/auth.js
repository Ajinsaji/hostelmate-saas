const jwt = require("jsonwebtoken");

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
};

const auth = (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const secret = process.env.JWT_SECRET || "change_me_secret";
    const payload = jwt.verify(token, secret);

    if (!payload || !payload.role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // hostId is optional depending on role.
    // For notifications isolation we will scope by hostelId only when present.
    req.user = {
      userId: payload.userId || payload.ownerId,
      role: payload.role,
      hostelId: payload.hostelId || null,
    };


    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid/expired token" });
  }
};

const requireRole = (roles = []) => {
  return (req, res, next) => {
    auth(req, res, () => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: "Forbidden" });
      }

      return next();
    });
  };
};

module.exports = {
  auth,
  requireRole,
};
