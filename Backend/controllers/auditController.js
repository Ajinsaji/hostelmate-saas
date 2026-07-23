const AuditLog = require("../models/AuditLog");

const getAuditLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, severity, search } = req.query;
    
    const query = {};
    if (action) query.action = action;
    if (severity) query.severity = severity;
    if (search) {
      query.$or = [
        { details: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("adminId", "username email name role")
      .populate("hostelId", "hostelName")
      .populate("ownerId", "ownerName phone email");

    const total = await AuditLog.countDocuments(query);

    res.status(200).json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    const { logger } = require("../utils/logger");
    logger.error({ err: error }, "Failed to fetch audit logs");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getAuditLogs,
};
