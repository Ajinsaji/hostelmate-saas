const { requireRole } = require("./auth");
const contextMiddleware = require("./contextMiddleware");

const ownerAuth = (req, res, next) => {
  const wrapper = requireRole(["owner", "owner_admin", "Warden", "Cook", "Accountant"]);
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
