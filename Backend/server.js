require("dotenv").config();
const { logger, redactOptions } = require("./utils/logger");

// 1. Validate critical environment variables
const criticalEnvs = ["MONGO_URI", "JWT_SECRET"];
const missingCritical = criticalEnvs.filter(env => !process.env[env]);
if (missingCritical.length > 0) {
  logger.error({ missing: missingCritical, component: "Startup" }, `[FATAL] Missing required environment variables: ${missingCritical.join(", ")}`);
  logger.error("Please provide them in your environment configuration. Exiting...");
  process.exit(1);
}

// 2. Validate conditional / integration environment variables
if (process.env.USE_CLOUDINARY === "true") {
  const cloudinaryEnvs = ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"];
  const missingCloudinary = cloudinaryEnvs.filter(env => !process.env[env]);
  if (missingCloudinary.length > 0) {
    logger.warn({ missing: missingCloudinary, component: "Startup" }, `[WARN] USE_CLOUDINARY is true but missing variables: ${missingCloudinary.join(", ")}. Uploads will use disk storage fallback.`);
  }
}

if (process.env.NODE_ENV === "production") {
  if (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET.includes("mock")) {
    logger.warn({ component: "Startup" }, "[WARN] Production environment detected with missing or mock RAZORPAY_KEY_SECRET. Online payments will require valid gateway credentials.");
  }
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


app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

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
app.use(pinoHttp({ logger, redact: redactOptions }));


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
// API ROUTES & MAINTENANCE
// ==========================

const maintenanceModeMiddleware = require("./middleware/maintenanceMode");
app.use(maintenanceModeMiddleware);

// V2 WORKSPACE & SAAS ROUTES
const v2Routes = require("./routes/v2Routes");
app.use("/api/v2", v2Routes);

// SYSTEM HEALTH & MONITORING ENDPOINTS
const {
  getLiveHealth,
  getReadyHealth,
  getHealthStatus,
  getDatabaseHealth,
  getStorageHealth,
  getCacheHealth,
} = require("./controllers/healthController");

// Liveness probe (ultra-fast, node alive)
app.get("/api/health/live", getLiveHealth);
// Readiness probe (checks DB readiness)
app.get("/api/health/ready", getReadyHealth);
// Canonical health endpoint for frontend ConnectionContext & Render
app.get("/api/health", getHealthStatus);
app.get("/api/health/database", getDatabaseHealth);
app.get("/api/health/storage", getStorageHealth);
app.get("/api/health/cache", getCacheHealth);

// Safe FCM Diagnostic Endpoint (Phase 3 requirement)
app.get("/api/diagnostics/fcm", (req, res) => {
  const { getFcmDiagnostics } = require("./utils/firebaseAdmin");
  return res.status(200).json(getFcmDiagnostics());
});

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

// SHARED NOTIFICATION CENTER & WHATSAPP COMMUNICATION ENGINE
const notificationRoutes = require("./routes/notificationRoutes");
app.use("/api/notifications", notificationRoutes);

const notificationTemplateRoutes = require("./routes/notificationTemplateRoutes");
app.use("/api/notification-templates", notificationTemplateRoutes);

const communicationRoutes = require("./routes/communicationRoutes");
app.use("/api/communication", communicationRoutes);
app.use("/api/admin/communications", communicationRoutes);

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
// API 404 NOT FOUND HANDLER
// ==========================
// Guarantee that all unhandled /api/* endpoints return JSON, never HTML
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      code: "NOT_FOUND",
      message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    });
  }
  next();
});

// ==========================
// ERROR HANDLER
// ==========================
app.use(require("./middleware/errorHandler"));

// ==========================
// SERVER INITIALIZATION & STARTUP
// ==========================

const PORT = process.env.PORT || 5000;
const server = http.createServer(app);

setSocketServer(server);

const { seedDefaultFeaturesAndPlans } = require("./services/subscriptionService");

async function startServer() {
  try {
    // 1. Start HTTP Server listening on PORT first (ensures /api/health/live succeeds immediately)
    if (!server.listening) {
      server.listen(PORT, () => {
        logger.info({ port: PORT, env: process.env.NODE_ENV || "production" }, `✓ Server Running on Port ${PORT}`);
      }).on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          logger.info(`Server port ${PORT} is already in use.`);
        } else {
          logger.error({ err, component: "Server" }, "Server listen error");
        }
      });
    }

    // 2. Connect to Database asynchronously in background
    connectDB().then(async () => {
      // 3. Initialize subscription defaults (idempotent seeding)
      try {
        await seedDefaultFeaturesAndPlans();
      } catch (seedErr) {
        logger.warn({ err: seedErr, component: "Startup" }, "Subscription default seeding encountered an issue, will retry on next cycle");
      }

      // 4. Start Subscription Scheduler
      startSubscriptionScheduler(60 * 60 * 1000);
    }).catch((dbErr) => {
      logger.error({ err: dbErr, component: "Startup" }, "Background database connection error");
    });
  } catch (startupErr) {
    logger.error({ err: startupErr, component: "Startup" }, "Server startup error");
  }
}

startServer();

