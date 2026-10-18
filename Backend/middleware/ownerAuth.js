const { requireRole } = require("./auth");
const contextMiddleware = require("./contextMiddleware");

const ownerAuth = (req, res, next) => {
  const wrapper = requireRole(["super_admin", "admin", "eps_admin", "owner", "Owner", "owner_admin", "Warden", "warden", "Cook", "cook", "Accountant", "accountant"]);
  wrapper(req, res, () => {
    if (req.user) {
      req.owner = {
        ownerId: req.user.userId,
        hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
        role: req.user.role,
      };
    }
    // Chain contextMiddleware to populate req.context
    contextMiddleware(req, res, next);
  });
};

module.exports = ownerAuth;
