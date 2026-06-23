const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "job_seeker"
});

db.connect((err) => {
    if (err) {
        console.log("Koneksi gagal:", err);
    } else {
        console.log("MySQL terkoneksi");
    }
});

module.exports = db;