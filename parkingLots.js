const express = require("express");
const router = express.Router();

const db = require("../db");

// GET ALL PARKING LOTS
router.get("/", (req, res) => {

    const sql = "SELECT * FROM ParkingLots";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }
        res.json(results);
    });
});

module.exports = router;