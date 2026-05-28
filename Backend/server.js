require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const connectDB =
  require("./config/db");


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
        console.log("Blocked by CORS:", origin);
        callback(new Error("Blocked by CORS"));
      }
    },
    credentials: true,
  })
);


app.use(express.json());

// ==========================
// AUTO-CREATE UPLOADS FOLDER
// ==========================

const uploadsPath = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("✓ Uploads folder created at startup");
}

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);


// ==========================
// DATABASE
// ==========================

connectDB();


// ==========================
// API ROUTES
// ==========================

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


// RESIDENTS
app.use(
  "/api/residents",
  residentRoutes
);

// PAYMENTS
app.use(
  "/api/payments",
  paymentRoutes
);

// ADMIN
app.use(
  "/api/admin",
  adminRoutes
);

// STAFF
app.use(
  "/api/staff",
  staffRoutes
);

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

// NOTIFICATIONS
const notificationRoutes = require("./routes/notificationRoutes");
app.use(
  "/api/notifications",
  notificationRoutes
);



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
// SERVER
// ==========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
