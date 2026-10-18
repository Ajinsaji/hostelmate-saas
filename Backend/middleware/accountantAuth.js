const { auth } = require("./auth");
const contextMiddleware = require("./contextMiddleware");

const ACCOUNTANT_ROLES = new Set([
  "super_admin",
  "admin",
  "eps_admin",
  "owner",
  "Owner",
  "owner_admin",
  "Accountant",
  "accountant",
]);

const accountantAuth = (req, res, next) => {
  auth(req, res, () => {
    const role = req.user?.role;
    if (!role || !ACCOUNTANT_ROLES.has(role)) {
      return res.status(403).json({ success: false, message: "Forbidden: Accountant or Owner access required" });
    }

    req.owner = {
      ownerId: req.user.userId,
      hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
      role: req.user.role,
    };
    contextMiddleware(req, res, next);
  });
};

accountantAuth.isAccountantRole = (role) => ACCOUNTANT_ROLES.has(role);

module.exports = accountantAuth;
