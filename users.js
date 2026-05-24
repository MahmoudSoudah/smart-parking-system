const express = require("express");
const router = express.Router();

const db = require("../db");

// ===============================
// REGISTER USER
// ===============================
router.post("/register", (req, res) => {
    const {
        full_name,
        email,
        phone,
        password_hash,
        role
    } = req.body;

    if (!full_name || !email || !phone || !password_hash || !role) {
        return res.status(400).json({
            message: "Please fill all required fields"
        });
    }

    // Check if email already exists
    const checkEmailSql = "SELECT * FROM Users WHERE email = ?";

    db.query(checkEmailSql, [email], (checkErr, checkResult) => {
        if (checkErr) {
            console.log(checkErr);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (checkResult.length > 0) {
            return res.status(409).json({
                message: "Email already exists"
            });
        }

        const insertSql = `
            INSERT INTO Users
            (full_name, email, phone, password_hash, role)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.query(
            insertSql,
            [full_name, email, phone, password_hash, role],
            (err, result) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({
                        message: "Database error"
                    });
                }

                res.status(201).json({
                    message: "User registered successfully",
                    user_id: result.insertId
                });
            }
        );
    });
});

// ===============================
// LOGIN USER
// ===============================
router.post("/login", (req, res) => {
    const { email, password_hash } = req.body;

    if (!email || !password_hash) {
        return res.status(400).json({
            message: "Please enter email and password"
        });
    }

    const sql = "SELECT * FROM Users WHERE email = ?";

    db.query(sql, [email], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: "Database error"
            });
        }

        if (result.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const user = result[0];

        if (user.password_hash !== password_hash) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        res.status(200).json({
            message: "Login successful",
            user_id: user.user_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
        });
    });
});

module.exports = router;