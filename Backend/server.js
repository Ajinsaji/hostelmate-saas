require("dotenv").config();
const { logger } = require("./utils/logger");

// Fail-fast for missing critical environment variables
const criticalEnvs = ["MONGO_URI", "JWT_SECRET"];
const missingEnvs = criticalEnvs.filter(env => !process.env[env]);
if (missingEnvs.length > 0) {
  logger.error(`\x1b[31m[FATAL] Missing required environment variables: ${missingEnvs.join(", ")}\x1b[0m`);
  logger.error("Please provide them in your .env file or environment configuration. Exiting...");
  process.exit(1);
}

const http = require("http");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const pinoHttp = require("pino-http");

const cors = require("cors");
const path = require("path");
const fs = require("fs");
const { setSocketServer } = require("./utils/socketManager");
const { startSubscriptionScheduler } = require("./utils/subscriptionScheduler");

const connectDB = require("./config/db");


// ==========================
// ROUTES
// ==========================

const authRoutes =
  require("./routes/authRoutes");

const requestRoutes =
  require("./routes/requestRoutes");

const roomRoutes =
  require("./routes/roomRoutes");

const bedRoutes = require("./routes/bedRoutes");


const residentRoutes =
  require("./routes/residentRoutes");

const paymentRoutes =
  require("./routes/paymentRoutes");

const ownerRoutes =
  require("./routes/ownerRoutes");

const staffRoutes = require("./routes/staffRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const publicRoutes = require("./routes/publicRoutes");


// ==========================
// APP
// ==========================

const app = express();

// Trust Render/reverse-proxy headers for correct req.ip
app.set("trust proxy", 1);


// ==========================
// MIDDLEWARE
// ==========================



app.use(
  cors({
    origin: function (origin, callback) {
      if (
        !origin ||
        origin.includes("localhost") ||
        origin.includes("hostelmate-saas.vercel.app") ||
        // Allow official + any Vercel preview deployment for this project
        origin.includes("hostelmate-saas") && origin.includes("vercel.app") ||
        // Allow any Vercel preview deployment for this project
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        logger.info("Blocked by CORS:", origin);
        callback(new Error("Blocked by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json());

// Security Middleware
app.use(helmet());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // limit each IP to 2000 requests per windowMs in production
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Pino Request Logger
app.use(pinoHttp({ logger }));


// ==========================
// AUTO-CREATE UPLOADS FOLDER
// ==========================

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  logger.info("✓ Uploads folder created at startup");
}

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// ==========================
// DATABASE
// ==========================

const { seedDefaultFeaturesAndPlans } = require("./services/subscriptionService");
connectDB().then(() => {
  seedDefaultFeaturesAndPlans().catch((err) => logger.error("Seed error:", err));
});


// ==========================
// API ROUTES
// ==========================

// V2 WORKSPACE & SAAS ROUTES
const v2Routes = require("./routes/v2Routes");
app.use("/api/v2", v2Routes);

// SYSTEM HEALTH & MONITORING ENDPOINTS
const { getHealthStatus, getDatabaseHealth, getStorageHealth, getCacheHealth } = require("./controllers/healthController");
app.get("/api/health", getHealthStatus);
app.get("/api/health/database", getDatabaseHealth);
app.get("/api/health/storage", getStorageHealth);
app.get("/api/health/cache", getCacheHealth);

// AUTH
app.use(
  "/api/auth",
  authRoutes
);

// APPROVAL STATUS (UX persistence)
const approvalRoutes = require("./routes/approvalRoutes");
app.use("/api/auth", approvalRoutes);


// SESSION VERIFY
const verifyRoutes = require("./routes/verifyRoutes");
app.use("/api/auth", verifyRoutes);

// HOSTEL REQUEST
app.use(
  "/api/request",
  requestRoutes
);

// Compatibility alias for older/mobile clients
app.use(
  "/api/hostel-request",
  requestRoutes
);



// BUILDINGS
const buildingRoutes = require("./routes/buildingRoutes");
app.use("/api/buildings", buildingRoutes);

// FLOORS
const floorRoutes = require("./routes/floorRoutes");
app.use("/api/floors", floorRoutes);

// ROOMS
app.use(
  "/api/rooms",
  roomRoutes
);

// BEDS
app.use(
  "/api/beds",
  bedRoutes
);

// MAINTENANCE
const maintenanceRoutes = require("./routes/maintenanceRoutes");
app.use("/api/maintenance", maintenanceRoutes);



// RESIDENTS
app.use(
  "/api/residents",
  residentRoutes
);

// PAYMENTS (Resident Rent)
app.use(
  "/api/payments",
  paymentRoutes
);

// ENTERPRISE RENT COLLECTION MODULE
const rentPlanRoutes = require("./routes/rentPlanRoutes");
const rentInvoiceRoutes = require("./routes/rentInvoiceRoutes");
const rentPaymentRoutes = require("./routes/rentPaymentRoutes");
const ledgerRoutes = require("./routes/ledgerRoutes");
const depositRoutes = require("./routes/depositRoutes");
const rentReportRoutes = require("./routes/rentReportRoutes");

app.use("/api/rent-plans", rentPlanRoutes);
app.use("/api/rent-invoices", rentInvoiceRoutes);
app.use("/api/rent-payments", rentPaymentRoutes);
app.use("/api/ledger", ledgerRoutes);
app.use("/api/deposits", depositRoutes);
app.use("/api/rent-reports", rentReportRoutes);

// ENTERPRISE EXPENSE MANAGEMENT MODULE
const expenseCategoryRoutes = require("./routes/expenseCategoryRoutes");
const vendorRoutes = require("./routes/vendorRoutes");
const expenseRoutes = require("./routes/expenseRoutes");
const recurringExpenseRoutes = require("./routes/recurringExpenseRoutes");
const budgetRoutes = require("./routes/budgetRoutes");
const expenseReportRoutes = require("./routes/expenseReportRoutes");

app.use("/api/expense-categories", expenseCategoryRoutes);
app.use("/api/vendors", vendorRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/recurring-expenses", recurringExpenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/expense-reports", expenseReportRoutes);

// FINANCIAL PERIOD LOCK & ACCOUNTING PROTECTION
const financialPeriodRoutes = require("./routes/financialPeriodRoutes");
app.use("/api/financial-periods", financialPeriodRoutes);

// SHARED NOTIFICATION CENTER INFRASTRUCTURE
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const notificationTemplateRoutes = require("./routes/notificationTemplateRoutes");
app.use("/api/notification-templates", notificationTemplateRoutes);

// BACKGROUND JOB & SCHEDULER ENGINE
const jobRoutes = require("./routes/jobRoutes");
app.use("/api/jobs", jobRoutes);

// ENTERPRISE FOOD & MESS MANAGEMENT MODULE
const mealPlanRoutes = require("./routes/mealPlanRoutes");
const residentMealPlanRoutes = require("./routes/residentMealPlanRoutes");
const menuRoutes = require("./routes/menuRoutes");
const mealAttendanceRoutes = require("./routes/mealAttendanceRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const recipeRoutes = require("./routes/recipeRoutes");
const kitchenPurchaseRoutes = require("./routes/kitchenPurchaseRoutes");
const wasteRoutes = require("./routes/wasteRoutes");
const foodReportRoutes = require("./routes/foodReportRoutes");

app.use("/api/meal-plans", mealPlanRoutes);
app.use("/api/resident-meal-plans", residentMealPlanRoutes);
app.use("/api/menus", menuRoutes);
app.use("/api/meal-attendance", mealAttendanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/kitchen-purchases", kitchenPurchaseRoutes);
app.use("/api/waste", wasteRoutes);
app.use("/api/food-reports", foodReportRoutes);

// ENTERPRISE PROCUREMENT ERP MODULE
const procurementRoutes = require("./routes/procurementRoutes");
app.use("/api/procurement", procurementRoutes);

// ACCOUNTS PAYABLE (AP) MODULE
const accountsPayableRoutes = require("./routes/accountsPayableRoutes");
app.use("/api/accounts-payable", accountsPayableRoutes);

// BANK & CASH MANAGEMENT (TREASURY) MODULE
const treasuryRoutes = require("./routes/treasuryRoutes");
app.use("/api/treasury", treasuryRoutes);

// SAAS SUBSCRIPTION COMMERCIAL PAYMENTS










const saasPaymentRoutes = require("./routes/saasPaymentRoutes");
app.use("/api/saas-payments", saasPaymentRoutes);
app.use("/api/payments/subscription", saasPaymentRoutes);

// ADMIN
app.use(
  "/api/admin",
  adminRoutes
);

// SAAS ADMIN SUBSCRIPTIONS
const saasAdminRoutes = require("./routes/saasAdminRoutes");
app.use("/api/admin/subscriptions", saasAdminRoutes);

// STAFF
app.use(
  "/api/staff",
  staffRoutes
);

// PERMISSIONS (RBAC)
const permissionRoutes = require("./routes/permissionRoutes");
app.use("/api/permissions", permissionRoutes);

// SHIFT, ATTENDANCE, LEAVE & OVERTIME (PHASE 8.2)
const shiftRoutes = require("./routes/shiftRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const overtimeRoutes = require("./routes/overtimeRoutes");

app.use("/api/shifts", shiftRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/overtime", overtimeRoutes);

// ENTERPRISE PAYROLL ENGINE (PHASE 8.3)
const payrollRoutes = require("./routes/payrollRoutes");
app.use("/api/payroll", payrollRoutes);

// ENTERPRISE BUSINESS INTELLIGENCE & ANALYTICS (PHASE 9)
const analyticsRoutes = require("./routes/analyticsRoutes");
const reportRoutes = require("./routes/reportRoutes");

app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);

// OWNER
app.use(
  "/api/owner",
  ownerRoutes
);

// SUBSCRIPTION GATING (owner dashboard)
const subscriptionRoutes = require("./routes/subscriptionRoutes");
app.use("/api/owner", subscriptionRoutes);


// PUBLIC
app.use(
  "/api/public",
  publicRoutes
);


// AI ANALYTICS
const aiAnalyticsRoutes = require("./routes/aiAnalyticsRoutes");
app.use(
  "/api/dashboard",
  aiAnalyticsRoutes
);

// ENTERPRISE AI PLATFORM (PHASE 10)
const aiRoutes = require("./routes/aiRoutes");
app.use("/api/ai", aiRoutes);



// ==========================
// TEST ROUTE
// ==========================

app.get("/", (req, res) => {

  res.send(
    "HostelMate OS Backend Running"
  );

});

// ==========================
// HEALTH CHECK ENDPOINT
// ==========================
// Used by frontend loading screen to detect server availability

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});


// ==========================
// ERROR HANDLER
// ==========================
app.use(require("./middleware/errorHandler"));

// ==========================
// SERVER
// ==========================

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

setSocketServer(server);

server.listen(PORT, () => {
  logger.info(`Server Running on Port ${PORT}`);
  
  // Start subscription scheduler after server starts
  startSubscriptionScheduler(60 * 60 * 1000); // Run every hour
});
