const Joi = require("joi");

const createMealPlanSchema = Joi.object({
  planName: Joi.string().trim().required(),
  planCode: Joi.string().trim().required(),
  mealType: Joi.string().valid("Vegetarian", "Non-Vegetarian", "Mixed").default("Vegetarian"),
  monthlyCharge: Joi.number().min(0).required(),
  description: Joi.string().allow("", null),
  includesBreakfast: Joi.boolean().default(true),
  includesLunch: Joi.boolean().default(true),
  includesSnacks: Joi.boolean().default(true),
  includesDinner: Joi.boolean().default(true),
});

const assignResidentMealPlanSchema = Joi.object({
  residentId: Joi.string().required(),
  mealPlanId: Joi.string().required(),
  effectiveFrom: Joi.date().default(Date.now),
  remarks: Joi.string().allow("", null),
});

const createMenuSchema = Joi.object({
  menuDate: Joi.date().required(),
  breakfast: Joi.string().allow("", null),
  lunch: Joi.string().allow("", null),
  snacks: Joi.string().allow("", null),
  dinner: Joi.string().allow("", null),
  specialMenu: Joi.string().allow("", null),
  festivalName: Joi.string().allow("", null),
  status: Joi.string().valid("Draft", "Published", "Archived").default("Published"),
});

const recordAttendanceSchema = Joi.object({
  residentId: Joi.string().allow("", null),
  attendanceDate: Joi.date().default(Date.now),
  meal: Joi.string().valid("Breakfast", "Lunch", "Snacks", "Dinner").required(),
  status: Joi.string().valid("Present", "Absent", "Leave", "Guest Meal", "Extra Meal").default("Present"),
  guestName: Joi.string().allow("", null),
  extraMealCharge: Joi.number().min(0).default(0),
});

const createInventoryItemSchema = Joi.object({
  itemName: Joi.string().trim().required(),
  category: Joi.string().default("Grains & Pulses"),
  unit: Joi.string().default("Kg"),
  currentStock: Joi.number().min(0).default(0),
  minimumStock: Joi.number().min(0).default(10),
  reorderLevel: Joi.number().min(0).default(20),
  averageCost: Joi.number().min(0).default(0),
  supplierId: Joi.string().allow("", null),
});

const createRecipeSchema = Joi.object({
  dishName: Joi.string().trim().required(),
  mealType: Joi.string().valid("Breakfast", "Lunch", "Snacks", "Dinner").default("Lunch"),
  ingredients: Joi.array().items(
    Joi.object({
      ingredientId: Joi.string().required(),
      quantityPerServing: Joi.number().min(0.001).required(),
      unit: Joi.string().default("Kg"),
    })
  ),
  costPerServing: Joi.number().min(0).default(25),
  preparationTime: Joi.string().allow("", null),
});

const recordPurchaseSchema = Joi.object({
  vendorId: Joi.string().required(),
  purchaseDate: Joi.date().default(Date.now),
  invoiceNumber: Joi.string().allow("", null),
  items: Joi.array().items(
    Joi.object({
      inventoryItemId: Joi.string().required(),
      quantity: Joi.number().min(0.01).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).required(),
});

const recordWasteSchema = Joi.object({
  inventoryItemId: Joi.string().required(),
  wasteDate: Joi.date().default(Date.now),
  meal: Joi.string().default("Lunch"),
  quantity: Joi.number().min(0.01).required(),
  reason: Joi.string().valid("Spoilage", "Expired", "Cooking Waste", "Serving Waste", "Resident Waste").default("Spoilage"),
});

module.exports = {
  createMealPlanSchema,
  assignResidentMealPlanSchema,
  createMenuSchema,
  recordAttendanceSchema,
  createInventoryItemSchema,
  createRecipeSchema,
  recordPurchaseSchema,
  recordWasteSchema,
};
