require("dotenv").config();
const express = require("express");
const cors = require("cors");

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

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

app.use(express.json());

app.use(
  "/uploads",
  express.static("uploads")
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

app.listen(5000, () => {

  console.log(
    "Server Running on Port 5000"
  );

});