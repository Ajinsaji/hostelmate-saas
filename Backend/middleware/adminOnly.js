module.exports = (req, res, next) => {
  if (!["admin", "super_admin"].includes(req.user?.role)) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  return next();
};