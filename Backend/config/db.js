const { logger } = require("../utils/logger");
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    logger.info("✅ MongoDB Connected");
  } catch (error) {
    logger.error({ err: error?.message || error }, "❌ MongoDB Connection Error");
  }
};

module.exports = connectDB;
