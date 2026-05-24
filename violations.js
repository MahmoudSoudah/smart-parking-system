const express = require("express");
const router = express.Router();

const db = require("../db");

// ===============================
// CREATE VIOLATION (OVERSTAY CHECK)
// ===============================
router.post("/check", (req, res) => {

    const { reservation_id, actual_exit } = req.body;

    if (!reservation_id || !actual_exit) {
        return res.status(400).json({
            message: "reservation_id and actual_exit are required"
        });
    }

    // STEP 1: Get reservation data
    const sql = `
        SELECT * FROM Reservations
        WHERE reservation_id = ?
    `;

    db.query(sql, [reservation_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "Reservation not found"
            });
        }

        const reservation = result[0];

        const endTime = new Date(reservation.end_time);
        const exitTime = new Date(actual_exit);

        // STEP 2: Check overstay
        let overstayMinutes = 0;

        if (exitTime > endTime) {
            overstayMinutes = Math.ceil((exitTime - endTime) / (1000 * 60));
        }

        // STEP 3: Fine calculation (simple rule)
        const fineAmount = overstayMinutes * 0.5; // 0.5 per minute

        // STEP 4: Insert violation
        const insertSql = `
            INSERT INTO Violations
            (reservation_id, user_id, overstay_minutes, fine_amount, violation_status, created_at)
            VALUES (?, ?, ?, ?, 'unpaid', NOW())
        `;

        db.query(
            insertSql,
            [
                reservation_id,
                reservation.user_id,
                overstayMinutes,
                fineAmount
            ],
            (err2, result2) => {

                if (err2) {
                    return res.status(500).json({
                        message: "Violation insert error"
                    });
                }

                res.status(201).json({
                    message: "Violation checked",
                    overstay_minutes: overstayMinutes,
                    fine: fineAmount,
                    violation_id: result2.insertId
                });
            }
        );
    });
});

module.exports = router;