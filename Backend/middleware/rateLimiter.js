const rateLimit = require("express-rate-limit");

/**
 * Public APIs (No Authentication)
 * Threshold: 100 requests per 15 minutes per IP
 * Use for: /api/public/*
 */
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Authenticated APIs (Owners / Residents)
 * Threshold: 300 requests per 15 minutes per User
 * Use for: /api/owner/*, /api/resident/*
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: "Rate limit exceeded. Please slow down your requests."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Limit by user ID if authenticated, fallback to IP
    return req.user ? req.user._id.toString() : req.ip;
  }
});

/**
 * Admin APIs (Super Admin)
 * Threshold: 600 requests per 15 minutes per Admin
 * Use for: /api/admin/*
 */
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  message: {
    success: false,
    message: "Admin rate limit exceeded."
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin ? req.admin._id.toString() : req.ip;
  }
});

module.exports = {
  publicLimiter,
  authLimiter,
  adminLimiter
};
