const Communication = require("../models/Communication");

const getCommunications = async (req, res) => {
  try {
    const { page = 1, limit = 50, type, status, hostelId } = req.query;
    
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (hostelId) query.hostelId = hostelId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const communications = await Communication.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("hostelId", "hostelName")
      .populate("ownerId", "ownerName phone email");

    const total = await Communication.countDocuments(query);

    res.status(200).json({
      success: true,
      communications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    const { logger } = require("../utils/logger");
    logger.error({ err: error }, "Failed to fetch communications");
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  getCommunications,
};
