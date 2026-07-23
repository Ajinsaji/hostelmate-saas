const { logger } = require("../utils/logger");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("✅ MongoDB Connected");
  } catch (error) {
    logger.error("❌ MongoDB Connection Error:");
    logger.error(error);          // Full error object
    logger.error(error.stack);    // Full stack trace
    process.exit(1);
  }
};

module.exports = connectDB;
