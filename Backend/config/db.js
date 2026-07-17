const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:");
    console.error(error);          // Full error object
    console.error(error.stack);    // Full stack trace
    process.exit(1);
  }
};

module.exports = connectDB;