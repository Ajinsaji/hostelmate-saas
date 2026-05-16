const jwt = require("jsonwebtoken");

const Owner = require("../models/Owner");
const Staff = require("../models/Staff");
const Admin = require("../models/Admin");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");

const getBearerToken = (req) => {
  const authHeader = req.headers.authorization || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : null;
};

const getError = (status, message) => ({ success: false, message });

const verifySession = async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) {
      return res.status(401).json(getError(401, "Missing token"));
    }

    const secret = process.env.JWT_SECRET || "change_me_secret";
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (e) {
      return res.status(401).json(getError(401, "Invalid/expired token"));
    }

    if (!payload?.role) {
      return res.status(401).json(getError(401, "Invalid token payload"));
    }

    // Role-specific checks
    const role = payload.role;
    const userId = payload.userId || payload.ownerId;
    const hostelIdFromToken = payload.hostelId;

    if (!userId) {
      return res.status(401).json(getError(401, "Invalid token: missing userId"));
    }

    let userDoc = null;
    let hostelId = hostelIdFromToken || null;

    if (role === "owner" || role === "warden" || role === "cook") {
      // owner flow
      userDoc = await Owner.findById(userId);
      if (!userDoc && role !== "owner") {
        userDoc = await Staff.findById(userId);
      }

      if (!userDoc) {
        return res.status(401).json(getError(401, "Account no longer exists"));
      }

      // status active check
      const status = userDoc.status ?? userDoc.isActive;
      const isActive = role === "owner" ? status !== "disabled" && status !== "suspended" : !!userDoc.isActive;
      if (!isActive) {
        return res.status(401).json(getError(401, "Account is inactive or removed"));
      }

      hostelId = userDoc.hostelId || hostelIdFromToken;
      if (!hostelId) {
        return res.status(401).json(getError(401, "Hostel not found for account"));
      }
    } else if (role === "admin") {
      userDoc = await Admin.findById(userId);
      if (!userDoc) {
        return res.status(401).json(getError(401, "Admin no longer exists"));
      }
    } else {
      return res.status(401).json(getError(401, "Unsupported role"));
    }

    if (role === "owner" || role === "warden" || role === "cook") {
      const hostel = await Hostel.findById(hostelId);
      if (!hostel) {
        return res.status(401).json(getError(401, "Hostel was removed"));
      }

      // subscription check (if present)
      const subscription = await Subscription.findOne({ hostelId });
      if (subscription) {
        const end = subscription.subscriptionEndDate;
        const status = subscription.subscriptionStatus;
        const isExpired = end ? new Date(end).getTime() < Date.now() : false;
        const isActiveSub = status !== "expired" && !isExpired;
        if (!isActiveSub) {
          return res.status(401).json(getError(401, "Subscription expired"));
        }
      }

      return res.status(200).json({
        success: true,
        message: "Session valid",
        session: {
          role,
          userId,
          hostelId,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Session valid",
      session: {
        role,
        userId,
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: "Session verification failed", details: e?.message || String(e) });
  }
};

module.exports = { verifySession };

