const { auth } = require("./auth");
const contextMiddleware = require("./contextMiddleware");

const KITCHEN_ROLES = new Set([
  "super_admin",
  "admin",
  "eps_admin",
  "owner",
  "Owner",
  "owner_admin",
  "Warden",
  "warden",
  "Cook",
  "cook",
]);

const kitchenAuth = (req, res, next) => {
  auth(req, res, () => {
    if (!KITCHEN_ROLES.has(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    req.owner = {
      ownerId: req.user.userId,
      hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
      role: req.user.role,
    };
    contextMiddleware(req, res, next);
  });
};

kitchenAuth.isKitchenRole = (role) => KITCHEN_ROLES.has(role);

module.exports = kitchenAuth;