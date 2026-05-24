require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");

// Import Route Handlers
const adminRoute = require("./routes/admin_route");
const userRoutes = require("./routes/users");
const vehicleRoutes = require("./routes/vehicles");
const parkingLotsRoutes = require("./routes/parkingLots");
const parkingSlotsRoutes = require("./routes/parkingSlots");
const reservationRoutes = require("./routes/reservations");
const paymentRoutes = require("./routes/payments");
const violationRoutes = require("./routes/violations");

// Environment Diagnostics
console.log("=== SYSTEM ENV CHECK ===");
console.log(`DB_USER: ${process.env.DB_USER || "NOT SET"}`);
console.log(`DB_NAME: ${process.env.DB_NAME || "NOT SET"}`);
console.log(`PORT:    ${process.env.PORT || "NOT SET"}`);
console.log("========================\n");

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middleware
app.use(cors());
app.use(express.json());

// API Endpoints Mapping
app.use("/admin", adminRoute);
app.use("/users", userRoutes);
app.use("/vehicles", vehicleRoutes);
app.use("/lots", parkingLotsRoutes);
app.use("/slots", parkingSlotsRoutes);
app.use("/reservations", reservationRoutes);
app.use("/payments", paymentRoutes);
app.use("/violations", violationRoutes);

// Base System Health Check Route
app.get("/", (req, res) => {
    res.send("Smart Parking System Backend is Running 🚗");
});

// Database Connectivity Test Route
app.get("/test-db", (req, res) => {
    db.query("SELECT 1 + 1 AS result", (err, results) => {
        if (err) {
            return res.status(500).json({
                message: "Database connection failed",
                error: err.message
            });
        }
        res.json({
            message: "Database connection successful!",
            data: results
        });
    });
});

// Catch-all 404 handler for unmatched routes
app.use((req, res) => {
    res.status(404).json({ 
        message: `Endpoint Not Found: ${req.method} ${req.originalUrl}` 
    });
});

// Initialize Server
app.listen(PORT, () => {
    console.log(`🚀 Server successfully running on port ${PORT}`);
});