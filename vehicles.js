const express = require("express");
const router = express.Router();

const db = require("../db");


// ===============================
// ADD VEHICLE
// ===============================
router.post("/add", (req, res) => {

    const {
        user_id,
        plate_number,
        vehicle_type,
        brand,
        color
    } = req.body;

    if (!user_id || !plate_number || !vehicle_type) {
        return res.status(400).json({
            message: "user_id, plate_number, and vehicle_type are required"
        });
    }

    const sql = `
        INSERT INTO Vehicles
        (user_id, plate_number, vehicle_type, brand, color)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [user_id, plate_number, vehicle_type, brand, color],
        (err, result) => {

            if (err) {
                console.log(err);
                return res.status(500).json({
                    message: "Database error"
                });
            }

            res.status(201).json({
                message: "Vehicle added successfully",
                vehicle_id: result.insertId
            });
        }
    );
});


// ===============================
// GET USER VEHICLES
// ===============================
router.get("/user/:id", (req, res) => {

    const user_id = req.params.id;

    const sql = "SELECT * FROM Vehicles WHERE user_id = ?";

    db.query(sql, [user_id], (err, results) => {

        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        res.status(200).json(results);
    });
});

module.exports = router;