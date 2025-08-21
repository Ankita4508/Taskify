require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const expressLayouts = require("express-ejs-layouts");
const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/auth.routes");
const taskRoutes = require("./src/routes/task.route");

// -----------------------------
// Start Task Reminder Scheduler
// -----------------------------
require("./src/scheduler/reminderScheduler");

const app = express();

// -----------------------------
// Database Connection
// -----------------------------
(async () => {
  try {
    await connectDB(process.env.MONGODB_URI);
    console.log("✅ MongoDB connected successfully");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
})();

// -----------------------------
// View Engine Setup
// -----------------------------
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(expressLayouts);
app.set("layout", "layout"); // default layout file: views/layout.ejs
app.use(express.static(path.join(__dirname, "public"))); // CSS, JS, images

// -----------------------------
// Middleware
// -----------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // for form data
app.use(cookieParser());

// -----------------------------
// Routes
// -----------------------------

// Homepage route (renders index.ejs)
app.get("/", (req, res) => {
  res.render("index", { title: "Taskify - Smart Task Manager" });
});

// Authentication routes
app.use("/", authRoutes);

// Task routes (dashboard and task CRUD)
app.use("/tasks", taskRoutes);

// -----------------------------
// Catch 404
// -----------------------------
app.use((req, res) => {
  res.status(404).render("404", { title: "Page Not Found" });
});

// -----------------------------
// Server Start
// -----------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
