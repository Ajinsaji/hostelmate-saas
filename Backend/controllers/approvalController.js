const HostelRequest = require("../models/HostelRequest");

// Safe lightweight endpoint used ONLY for UX persistence.
// Does NOT create sessions / tokens.
const checkHostelRequestApproval = async (req, res) => {
  try {
    const { phone } = req.query || {};

    // Since current registration stores phone and HostelRequest schema has no email,
    // we use phone as the stable identifier.
    if (!phone) {
      return res.status(400).json({
        approved: false,
        rejected: false,
        status: "Unknown",
        message: "Missing phone",
      });
    }

    const request = await HostelRequest.findOne({ phone });

    if (!request) {
      return res.status(200).json({
        approved: false,
        rejected: false,
        status: "NotFound",
      });
    }

    const normalized = String(request.status || "pending").toLowerCase();
    const approved = normalized === "approved";
    const rejected = normalized === "rejected";


    return res.status(200).json({
      approved,
      rejected,
      status: request.status,
      requestId: request._id,
    });
  } catch (e) {
    return res.status(500).json({
      approved: false,
      rejected: false,
      status: "Error",
      message: e?.message || String(e),
    });
  }
};

module.exports = {
  checkHostelRequestApproval,
};

