const express = require("express");
const router = express.Router();

const db = require("../db");

// ===============================
// CREATE PAYMENT
// ===============================
router.post("/pay", (req, res) => {

    const { reservation_id, payment_method } = req.body;

    if (!reservation_id || !payment_method) {
        return res.status(400).json({
            message: "reservation_id and payment_method are required"
        });
    }

    // STEP 1: Get reservation + slot + lot info
    const sql = `
        SELECT r.*, l.hourly_rate
        FROM Reservations r
        JOIN ParkingSlots s ON r.slot_id = s.slot_id
        JOIN ParkingLots l ON s.lot_id = l.lot_id
        WHERE r.reservation_id = ?
    `;

    db.query(sql, [reservation_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        const reservation = result[0];

        // STEP 2: Calculate hours
        const start = new Date(reservation.start_time);
        const end = new Date(reservation.end_time);

        const hours = Math.ceil((end - start) / (1000 * 60 * 60));

        const amount = hours * reservation.hourly_rate;

        // STEP 3: Insert payment
        const insertSql = `
            INSERT INTO Payments
            (reservation_id, amount, payment_method, payment_status, paid_at)
            VALUES (?, ?, ?, 'paid', NOW())
        `;

        db.query(
            insertSql,
            [reservation_id, amount, payment_method],
            (err2, result2) => {

                if (err2) {
                    return res.status(500).json({
                        message: "Payment error",
                        error: err2
                    });
                }

                res.status(201).json({
                    message: "Payment successful",
                    payment_id: result2.insertId,
                    amount: amount,
                    hours: hours
                });
            }
        );
    });
});

module.exports = router;