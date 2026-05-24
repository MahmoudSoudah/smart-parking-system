const express = require("express");
const router = express.Router();

const db = require("../db");

// GET SLOTS BY LOT ID
router.get("/:lot_id", (req, res) => {

    const sql = "SELECT * FROM ParkingSlots WHERE lot_id = ?";

    db.query(sql, [req.params.lot_id], (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;