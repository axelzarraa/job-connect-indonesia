const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../config/db");

const router = express.Router();

router.get("/register", (req, res) => {
    res.render("auth/register");
});

router.post("/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const sql = "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)";

    db.query(sql, [name, email, hashedPassword, role], (err) => {
        if (err) {
            console.log(err);
            return res.send("Register gagal");
        }

        res.redirect("/login");
    });
});

router.get("/login", (req, res) => {
    res.render("auth/login");
});

router.post("/login", (req, res) => {
    const { email, password } = req.body;

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.send("Email tidak ditemukan");
        }

        const user = results[0];
        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.send("Password salah");
        }

        req.session.user = user;

        if (user.role === "hrd") {
            res.redirect("/hrd/dashboard");
        } else {
            res.redirect("/seeker/dashboard");
        }
    });
});

router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

module.exports = router;