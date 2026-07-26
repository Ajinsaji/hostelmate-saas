const ExpenseCategory = require("../models/ExpenseCategory");
const { logger } = require("../utils/logger");

const DEFAULT_CATEGORIES = [
  { name: "Food & Groceries", code: "FOOD", icon: "shopping-bag", color: "#10b981" },
  { name: "LPG & Gas", code: "GAS", icon: "flame", color: "#f59e0b" },
  { name: "Electricity Bill", code: "ELEC", icon: "zap", color: "#3b82f6" },
  { name: "Water Bill", code: "WATER", icon: "droplet", color: "#06b6d4" },
  { name: "Internet & Wi-Fi", code: "WIFI", icon: "wifi", color: "#8b5cf6" },
  { name: "Cleaning & Housekeeping", code: "CLEAN", icon: "sparkles", color: "#ec4899" },
  { name: "Laundry Services", code: "LAUNDRY", icon: "shirt", color: "#6366f1" },
  { name: "Repairs & Maintenance", code: "REPAIR", icon: "wrench", color: "#ef4444" },
  { name: "Staff Salary", code: "SALARY", icon: "users", color: "#14b8a6" },
  { name: "Furniture & Assets", code: "ASSETS", icon: "box", color: "#f97316" },
  { name: "Transport & Fuel", code: "FUEL", icon: "truck", color: "#84cc16" },
  { name: "Medical & First Aid", code: "MED", icon: "heart-pulse", color: "#f43f5e" },
  { name: "Taxes & Subscriptions", code: "TAX", icon: "file-text", color: "#64748b" },
  { name: "Miscellaneous", code: "MISC", icon: "more-horizontal", color: "#94a3b8" },
];

/**
 * Seed default categories for a hostel if none exist
 */
async function seedDefaultCategories(hostelId) {
  const existingCount = await ExpenseCategory.countDocuments({ hostelId });
  if (existingCount > 0) return;

  const docs = DEFAULT_CATEGORIES.map((cat) => ({
    tenantId: hostelId,
    hostelId,
    categoryName: cat.name,
    categoryCode: cat.code,
    icon: cat.icon,
    color: cat.color,
    isSystem: true,
    status: "Active",
  }));

  await ExpenseCategory.insertMany(docs);
  logger.info(`Seeded ${docs.length} default expense categories for hostel ${hostelId}`);
}

async function createCategory(data, userContext = {}) {
  const hostelId = data.hostelId || userContext.hostelId;
  if (!hostelId) throw new Error("Hostel ID is required");

  await seedDefaultCategories(hostelId);

  const category = await ExpenseCategory.create({
    ...data,
    tenantId: hostelId,
    hostelId,
    createdBy: userContext.userId,
  });

  return category;
}

async function getCategories(hostelId) {
  await seedDefaultCategories(hostelId);
  return await ExpenseCategory.find({ hostelId, status: "Active" }).sort({ categoryName: 1 });
}

module.exports = {
  seedDefaultCategories,
  createCategory,
  getCategories,
};
