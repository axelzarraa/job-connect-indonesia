const express = require("express");
const db = require("../config/db");

const router = express.Router();

function isHrd(req, res, next) {
    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.role !== "hrd") {
        return res.send("Akses ditolak. Khusus HRD.");
    }

    next();
}

router.get("/dashboard", isHrd, (req, res) => {
    const userId = req.session.user.id;

    const sqlJobs = `
        SELECT COUNT(jobs.id) AS total_jobs
        FROM jobs
        JOIN companies ON jobs.company_id = companies.id
        WHERE companies.user_id = ?
    `;

    const sqlApplications = `
        SELECT COUNT(applications.id) AS total_applications
        FROM applications
        JOIN jobs ON applications.job_id = jobs.id
        JOIN companies ON jobs.company_id = companies.id
        WHERE companies.user_id = ?
    `;

    db.query(sqlJobs, [userId], (err, jobResult) => {
        if (err) throw err;

        db.query(sqlApplications, [userId], (err, appResult) => {
            if (err) throw err;

            res.render("hrd/dashboard", {
                user: req.session.user,
                totalJobs: jobResult[0].total_jobs,
                totalApplications: appResult[0].total_applications
            });
        });
    });
});

router.get("/jobs", isHrd, (req, res) => {
    const userId = req.session.user.id;

    const sqlCompany = "SELECT * FROM companies WHERE user_id = ?";

    db.query(sqlCompany, [userId], (err, companyResult) => {
        if (err) throw err;

        if (companyResult.length === 0) {
            return res.redirect("/hrd/company");
        }

        const company = companyResult[0];

        db.query("SELECT * FROM jobs WHERE company_id = ?", [company.id], (err, jobs) => {
            if (err) throw err;

            res.render("hrd/jobs", { jobs });
        });
    });
});

router.get("/company", isHrd, (req, res) => {
    res.render("hrd/company");
});

router.post("/company", isHrd, (req, res) => {
    const { company_name, address, description } = req.body;
    const userId = req.session.user.id;

    const sql = "INSERT INTO companies (user_id, company_name, address, description) VALUES (?, ?, ?, ?)";

    db.query(sql, [userId, company_name, address, description], (err) => {
        if (err) throw err;

        res.redirect("/hrd/jobs");
    });
});

router.get("/jobs/create", isHrd, (req, res) => {
    res.render("hrd/create-job");
});

router.post("/jobs/create", isHrd, (req, res) => {
    const userId = req.session.user.id;
    const { title, description, requirement, deadline } = req.body;

    db.query("SELECT * FROM companies WHERE user_id = ?", [userId], (err, companyResult) => {
        if (err) throw err;

        const company = companyResult[0];

        const sql = "INSERT INTO jobs (company_id, title, description, requirement, deadline) VALUES (?, ?, ?, ?, ?)";

        db.query(sql, [company.id, title, description, requirement, deadline], (err) => {
            if (err) throw err;

            res.redirect("/hrd/jobs");
        });
    });
});

router.get("/applications", isHrd, (req, res) => {
    const userId = req.session.user.id;

    const sql = `
        SELECT 
            applications.id,
            applications.status,
            applications.created_at,
            jobs.title,
            users.name,
            users.email
        FROM applications
        JOIN jobs ON applications.job_id = jobs.id
        JOIN users ON applications.user_id = users.id
        JOIN companies ON jobs.company_id = companies.id
        WHERE companies.user_id = ?
        ORDER BY applications.id DESC
    `;

    db.query(sql, [userId], (err, applications) => {
        if (err) throw err;

        res.render("hrd/applications", { applications });
    });
});

router.get("/applications/status/:id/:status", isHrd, (req, res) => {
    const { id, status } = req.params;

    const allowedStatus = ["pending", "review", "accepted", "rejected"];

    if (!allowedStatus.includes(status)) {
        return res.send("Status tidak valid");
    }

    const sql = "UPDATE applications SET status = ? WHERE id = ?";

    db.query(sql, [status, id], (err) => {
        if (err) throw err;

        res.redirect("/hrd/applications");
    });
});

module.exports = router;

