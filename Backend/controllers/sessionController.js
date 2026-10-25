const jwt = require("jsonwebtoken");

const Owner = require("../models/Owner");
const Staff = require("../models/Staff");
const User = require("../models/User");
const Admin = require("../models/Admin");
const Hostel = require("../models/Hostel");
const Subscription = require("../models/Subscription");
const OwnerSession = require("../models/OwnerSession");

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

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json(getError(500, "Server misconfigured: JWT_SECRET missing"));
    }
    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (error) {
      return res.status(401).json(getError(401, "Invalid/expired token"));
    }

    if (!payload?.role) {
      return res.status(401).json(getError(401, "Invalid token payload"));
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
      if (session) {
        session.lastActiveAt = new Date();
        session.save().catch(() => {});
      }
    }

    // Role-specific checks (case-insensitive safe normalization)
    const role = payload.role;
    const normRole = (role || "").toLowerCase();
    const userId = payload.userId || payload.ownerId;
    const hostelIdFromToken = payload.hostelId;

    if (!userId) {
      return res.status(401).json(getError(401, "Invalid token: missing userId"));
    }

    let userDoc = null;
    let hostelId = hostelIdFromToken || null;

    if (normRole === "owner") {
      // 1. Check Owner model
      userDoc = await Owner.findById(userId);
      if (!userDoc) {
        // 2. Fallback to User model with owner role
        const candidateUser = await User.findById(userId);
        if (candidateUser && (candidateUser.role || "").toLowerCase() === "owner") {
          userDoc = candidateUser;
        }
      }

      if (!userDoc) {
        return res.status(401).json(getError(401, "Account no longer exists"));
      }

      const status = userDoc.status ?? userDoc.isActive;
      const isActive = status !== "disabled" && status !== "suspended" && status !== "Inactive";
      if (!isActive) {
        return res.status(401).json(getError(401, "Account is inactive or removed"));
      }

      hostelId = userDoc.hostelId || userDoc.activeHostelId || userDoc.tenantId || hostelIdFromToken;
      if (!hostelId) {
        return res.status(401).json(getError(401, "Hostel not found for account"));
      }

      const hostel = await Hostel.findById(hostelId);
      if (!hostel || hostel.isDeleted) {
        return res.status(401).json(getError(401, "Hostel was removed"));
      }

      // Subscription check for owner
      const subscription = await Subscription.findOne({ hostelId });
      if (subscription) {
        const end = subscription.subscriptionEndDate;
        const subStatus = subscription.subscriptionStatus;
        const isExpired = end ? new Date(end).getTime() < Date.now() : false;
        const isActiveSub = subStatus !== "expired" && !isExpired;
        if (!isActiveSub) {
          return res.status(401).json({
            success: false,
            message: "Subscription expired",
            code: "SUBSCRIPTION_EXPIRED",
          });
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

    if (["warden", "cook", "accountant"].includes(normRole)) {
      // Staff accounts created via staffService are stored in User model with Staff details
      userDoc = await User.findById(userId);

      if (userDoc) {
        if (userDoc.status === "Inactive") {
          return res.status(401).json(getError(401, "Account is inactive or removed"));
        }
        if ((userDoc.role || "").toLowerCase() !== normRole) {
          return res.status(401).json(getError(401, "Role mismatch"));
        }

        const staffDoc = await Staff.findOne({ userId: userDoc._id, isDeleted: false });
        if (staffDoc) {
          if (staffDoc.employmentStatus === "Inactive" || staffDoc.employmentStatus === "Terminated") {
            return res.status(401).json(getError(401, "Account is inactive or removed"));
          }
          hostelId = staffDoc.hostelId || userDoc.tenantId || hostelIdFromToken;
        } else {
          hostelId = userDoc.tenantId || hostelIdFromToken;
        }
      } else {
        // Fallback for legacy staff stored directly in Staff model
        const legacyStaff = await Staff.findById(userId);
        if (legacyStaff) {
          if (legacyStaff.isDeleted || legacyStaff.isActive === false || legacyStaff.employmentStatus === "Inactive" || legacyStaff.employmentStatus === "Terminated") {
            return res.status(401).json(getError(401, "Account is inactive or removed"));
          }
          hostelId = legacyStaff.hostelId || hostelIdFromToken;
          userDoc = legacyStaff;
        }
      }

      if (!userDoc) {
        return res.status(401).json(getError(401, "Account no longer exists"));
      }

      if (!hostelId) {
        return res.status(401).json(getError(401, "Hostel not found for account"));
      }

      const hostel = await Hostel.findById(hostelId);
      if (!hostel || hostel.isDeleted) {
        return res.status(401).json(getError(401, "Hostel was removed"));
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

    if (normRole === "admin" || normRole === "super_admin") {
      userDoc = await Admin.findById(userId);
      if (!userDoc) {
        return res.status(401).json(getError(401, "Admin no longer exists"));
      }

      if (userDoc.status && userDoc.status !== "active") {
        return res.status(401).json(getError(401, "Admin account is inactive"));
      }

      return res.status(200).json({
        success: true,
        message: "Session valid",
        session: {
          role,
          userId,
        },
      });
    }

    return res.status(401).json(getError(401, "Unsupported role"));
  } catch (e) {
    return res.status(500).json({ success: false, message: "Session verification failed", details: e?.message || String(e) });
  }
};

module.exports = { verifySession };

