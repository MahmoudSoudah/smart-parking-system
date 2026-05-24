const express = require("express");
const router = express.Router();

const db = require("../db");

// ===============================
// SMART BOOK SLOT (IMPROVED)
// ===============================
router.post("/book", (req, res) => {

    const {
        user_id,
        slot_id,
        vehicle_id,
        start_time,
        end_time
    } = req.body;

    if (!user_id || !slot_id || !vehicle_id) {
        return res.status(400).json({
            message: "Missing required fields"
        });
    }

    // STEP 1: Check if slot exists AND is available
    const checkSql = `
        SELECT * FROM ParkingSlots 
        WHERE slot_id = ? AND status = 'available'
    `;

    db.query(checkSql, [slot_id], (err, result) => {

        if (err) {
            return res.status(500).json({
                message: "Database error",
                error: err
            });
        }

        if (result.length === 0) {
            return res.status(400).json({
                message: "Slot not available or does not exist"
            });
        }

        // STEP 2: Create reservation
        const insertSql = `
            INSERT INTO Reservations
            (user_id, slot_id, vehicle_id, start_time, end_time, status)
            VALUES (?, ?, ?, ?, ?, 'active')
        `;

        db.query(
            insertSql,
            [user_id, slot_id, vehicle_id, start_time, end_time],
            (err2, result2) => {

                if (err2) {
                    return res.status(500).json({
                        message: "Database error",
                        error: err2
                    });
                }

                // STEP 3: Mark slot as occupied
                const updateSql = `
                    UPDATE ParkingSlots 
                    SET status = 'occupied' 
                    WHERE slot_id = ?
                `;

                db.query(updateSql, [slot_id]);

                res.status(201).json({
                    message: "Booking successful",
                    reservation_id: result2.insertId
                });
            }
        );
    });
});

module.exports = router;