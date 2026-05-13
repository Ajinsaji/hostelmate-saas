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

const allowedOrigins = [
  "http://localhost:5173",
  "https://hostelmate-saas.vercel.app",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (e.g. mobile apps, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
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

// PUBLIC
app.use(
  "/api/public",
  publicRoutes
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
// SERVER
// ==========================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server Running on Port ${PORT}`);
});
