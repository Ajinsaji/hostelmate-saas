const express = require("express");
const router = express.Router();
const accountantAuth = require("../middleware/accountantAuth");
const { auth, requireRole } = require("../middleware/auth");
const { getPeriods, closePeriod, unlockPeriod } = require("../controllers/financialPeriodController");

const ownerCloseAuth = (req, res, next) => {
  const wrapper = requireRole(["super_admin", "admin", "eps_admin", "owner", "Owner", "owner_admin"]);
  wrapper(req, res, () => {
    if (req.user) {
      req.owner = {
        ownerId: req.user.userId,
        hostelId: req.user.hostelId || req.user.hostelID || req.user?.hostel?._id || null,
        role: req.user.role,
      };
    }
    const contextMiddleware = require("../middleware/contextMiddleware");
    contextMiddleware(req, res, next);
  });
};

router.get("/", accountantAuth, getPeriods);
router.post("/close", ownerCloseAuth, closePeriod);
router.post("/unlock", auth, requireRole(["super_admin", "admin", "Admin", "SuperAdmin", "eps_admin"]), unlockPeriod);

module.exports = router;
