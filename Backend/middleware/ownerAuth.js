const { requireRole } = require("./auth");

const ownerAuth = (req, res, next) => {
  const wrapper = requireRole(["owner"]);
  wrapper(req, res, () => {
    if (req.user) {
      req.owner = {
        ownerId: req.user.userId,
        hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
        role: req.user.role,
      };
    }
    next();
  });
};

module.exports = ownerAuth;

