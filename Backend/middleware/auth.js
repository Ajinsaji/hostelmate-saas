const jwt = require("jsonwebtoken");

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
};

const OwnerSession = require("../models/OwnerSession");

const auth = async (req, res, next) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: "Missing token" });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Server misconfigured: JWT_SECRET missing" });
    }
    const payload = jwt.verify(token, secret);

    if (!payload || !payload.role) {
      return res.status(401).json({ success: false, message: "Invalid token payload" });
    }

    // Check if session has been revoked or expired
    if (payload.sessionId) {
      const session = await OwnerSession.findOne({ sessionId: payload.sessionId });
      const isExpired = session?.expiresAt ? new Date(session.expiresAt).getTime() < Date.now() : false;

      if (session && (session.isRevoked || isExpired)) {
        return res.status(401).json({
          success: false,
          message: "Your session has ended. Please sign in again.",
          code: "SESSION_REVOKED",
        });
      }
      // Update last active timestamp silently
      if (session) {
        session.lastActiveAt = new Date();
        session.save().catch(() => {});
      }
    }

    req.sessionId = payload.sessionId || req.headers["x-session-id"] || null;
    req.user = {
      id: payload.userId || payload.ownerId,
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
