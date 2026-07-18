require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

const authRoutes = require("./routes/auth");
const expenseRoutes = require("./routes/expenses");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);

// Health-check
app.get("/", (_req, res) => res.json({ status: "ok", message: "Expense Tracker API" }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Database + listen ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL: MONGO_URI is not set in environment.");
  process.exit(1);
}

if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in environment.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

module.exports = app; // exported for potential test use
