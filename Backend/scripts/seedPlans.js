const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const connectDB = require("../config/db");
const { seedDefaultFeaturesAndPlans } = require("../services/subscriptionService");
const { logger } = require("../utils/logger");

async function runSeed() {
  try {
    await connectDB();
    logger.info("Database connected. Seeding subscription features, plans, and billing settings...");
    const result = await seedDefaultFeaturesAndPlans();
    logger.info("Successfully seeded subscription defaults:", result);
    process.exit(0);
  } catch (error) {
    logger.error("Seeding failed:", error);
    process.exit(1);
  }
}

runSeed();
