const express = require("express");
const path = require("path");
const session = require("express-session");
const db = require("./config/db");

const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

app.use(session({
    secret: "jobseeker_secret",
    resave: false,
    saveUninitialized: false
}));

app.get("/", (req, res) => {
    res.render("home");
});

const authRoutes = require("./routes/auth");
app.use("/", authRoutes);

const hrdRoutes = require("./routes/hrd");
app.use("/hrd", hrdRoutes);

const seekerRoutes = require("./routes/seeker");
app.use("/seeker", seekerRoutes);

app.listen(3000, () => {
    console.log("Server jalan di http://localhost:3000");
});

