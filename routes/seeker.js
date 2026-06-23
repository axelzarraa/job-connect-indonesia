const express = require("express");
const db = require("../config/db");
const multer = require("multer");
const path = require("path");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

function isSeeker(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.role !== "jobseeker") {
        return res.send("Akses ditolak. Khusus Job Seeker.");
    }

    next();
}

router.get("/dashboard", isSeeker, (req, res) => {
    const sql = `
        SELECT jobs.*, companies.company_name
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        ORDER BY jobs.id DESC
    `;

    db.query(sql, (err, jobs) => {
        if (err) throw err;

        const message = req.session.message;
req.session.message = null;

res.render("seeker/dashboard", {
    user: req.session.user,
    jobs,
    message
});
    });
});

router.get("/apply/:id", isSeeker, (req, res) => {
    const jobId = req.params.id;
    const userId = req.session.user.id;

    const checkSql = `
        SELECT * FROM applications
        WHERE job_id = ? AND user_id = ?
    `;

    db.query(checkSql, [jobId, userId], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.message = {
    type: "warning",
    text: "Anda sudah melamar pekerjaan ini."
};

return res.redirect("/seeker/dashboard");
        }

        const insertSql = `
            INSERT INTO applications (job_id, user_id, status)
            VALUES (?, ?, 'pending')
        `;

        db.query(insertSql, [jobId, userId], (err) => {
            if (err) {
                console.log(err);
                return res.send("Gagal melamar");
            }

           req.session.message = {
    type: "success",
    text: "Lamaran berhasil dikirim."
};

res.redirect("/seeker/dashboard");
        });
    });
});

router.get("/portfolio", isSeeker, (req, res) => {
    const userId = req.session.user.id;

    db.query("SELECT * FROM portfolios WHERE user_id = ?", [userId], (err, result) => {
        if (err) throw err;

        res.render("seeker/portfolio", {
            portfolio: result[0]
        });
    });
});

router.post("/portfolio", isSeeker, upload.single("cv"), (req, res) => {
    const userId = req.session.user.id;
    const { skill, education, experience } = req.body;
    const cv = req.file ? req.file.filename : null;

    db.query("SELECT * FROM portfolios WHERE user_id = ?", [userId], (err, result) => {
        if (err) throw err;

        if (result.length > 0) {
            const oldCv = result[0].cv;
            const finalCv = cv || oldCv;

            const sql = `
                UPDATE portfolios 
                SET skill = ?, education = ?, experience = ?, cv = ?
                WHERE user_id = ?
            `;

            db.query(sql, [skill, education, experience, finalCv, userId], (err) => {
                if (err) throw err;

                res.redirect("/seeker/portfolio");
            });
        } else {
            const sql = `
                INSERT INTO portfolios (user_id, skill, education, experience, cv)
                VALUES (?, ?, ?, ?, ?)
            `;

            db.query(sql, [userId, skill, education, experience, cv], (err) => {
                if (err) throw err;

                res.redirect("/seeker/portfolio");
            });
        }
    });
});

module.exports = router;