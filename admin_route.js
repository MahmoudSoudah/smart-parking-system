const express = require("express");
const router  = express.Router();
const db      = require("../db");

// ── ADD THIS: Test Route to verify /admin works ───────────────
router.get("/", (req, res) => {
  res.json({ message: "Admin root route is working! 🔐" });
});

// ── GET all users ─────────────────────────────────────────────
router.get("/users", (req, res) => {
  db.query("SELECT user_id, full_name, email, phone, role, created_at FROM Users", (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// ── GET all reservations (full join) ─────────────────────────
router.get("/reservations", (req, res) => {
  const sql = `
    SELECT r.reservation_id, r.start_time, r.end_time, r.status,
           u.full_name, u.email,
           v.plate_number, v.vehicle_type,
           ps.slot_number, ps.slot_type,
           pl.lot_name, pl.city
    FROM   Reservations r
    JOIN   Users        u  ON r.user_id    = u.user_id
    JOIN   Vehicles     v  ON r.vehicle_id = v.vehicle_id
    JOIN   ParkingSlots ps ON r.slot_id    = ps.slot_id
    JOIN   ParkingLots  pl ON ps.lot_id    = pl.lot_id
    ORDER  BY r.reservation_id DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json(results);
  });
});

// ── POST add a parking lot ────────────────────────────────────
router.post("/lots", (req, res) => {
  const { admin_id, lot_name, address, city, total_slots, hourly_rate, open_time, close_time } = req.body;
  if (!lot_name || !address || !city || !total_slots || !hourly_rate)
    return res.status(400).json({ message: "lot_name, address, city, total_slots, hourly_rate are required" });
  const sql = `INSERT INTO ParkingLots (admin_id, lot_name, address, city, total_slots, hourly_rate, open_time, close_time)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [admin_id || 1, lot_name, address, city, total_slots, hourly_rate, open_time || "07:00:00", close_time || "23:00:00"], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.status(201).json({ message: "Parking lot added", lot_id: result.insertId });
  });
});

// ── POST add a parking slot ───────────────────────────────────
router.post("/slots", (req, res) => {
  const { lot_id, slot_number, floor_level, slot_type } = req.body;
  if (!lot_id || !slot_number)
    return res.status(400).json({ message: "lot_id and slot_number are required" });
  const sql = `INSERT INTO ParkingSlots (lot_id, slot_number, floor_level, slot_type, status)
               VALUES (?, ?, ?, ?, 'available')`;
  db.query(sql, [lot_id, slot_number, floor_level || 1, slot_type || "standard"], (err, result) => {
    if (err) return res.status(500).json({ message: "Database error", error: err.message });
    res.status(201).json({ message: "Slot added", slot_id: result.insertId });
  });
});

// ── PUT update slot status ────────────────────────────────────
router.put("/slots/:slot_id/status", (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ message: "status is required" });
  db.query("UPDATE ParkingSlots SET status = ? WHERE slot_id = ?", [status, req.params.slot_id], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ message: "Slot status updated" });
  });
});

module.exports = router;