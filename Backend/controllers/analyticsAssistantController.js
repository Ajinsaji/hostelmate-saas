const { processNaturalLanguageQuery } = require("../services/ai/analyticsAssistantService");

exports.handleQuery = async (req, res, next) => {
  try {
    const tenantId = req.user.hostelId || req.user.tenantId || req.user.id;
    const userId = req.user.id;
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ success: false, message: "Query string is required" });
    }

    const result = await processNaturalLanguageQuery(tenantId, userId, query);
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
