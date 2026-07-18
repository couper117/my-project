const express = require("express");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const { protect } = require("../middleware/auth");
const {
  validateExpense,
  validateExpenseUpdate,
} = require("../validators");

const router = express.Router();

// All expense routes require a valid JWT
router.use(protect);

// ── GET /api/expenses/summary  (must come BEFORE /:id routes) ─────────────────
router.get("/summary", async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const pipeline = [
      // 1. Scope to the authenticated user
      { $match: { userId } },

      // 2. Group by category, summing amounts
      {
        $group: {
          _id: "$category",
          categoryTotal: { $sum: "$amount" },
        },
      },

      // 3. Collect category totals and compute the grand total in one $group
      {
        $group: {
          _id: null,
          total: { $sum: "$categoryTotal" },
          byCategory: {
            $push: { category: "$_id", total: "$categoryTotal" },
          },
        },
      },

      // 4. Clean up the output
      {
        $project: {
          _id: 0,
          total: 1,
          byCategory: 1,
        },
      },
    ];

    const [result] = await Expense.aggregate(pipeline);

    // If the user has no expenses, return zeroed response
    res.json({
      success: true,
      data: result || { total: 0, byCategory: [] },
    });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/expenses ─────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    // Optional query filters: ?category=food&startDate=2024-01-01&endDate=2024-12-31
    const filter = { userId: req.user._id };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }

    const expenses = await Expense.find(filter).sort({ date: -1 });
    res.json({ success: true, count: expenses.length, data: expenses });
  } catch (err) {
    next(err);
  }
});

// ── POST /api/expenses ────────────────────────────────────────────────────────
router.post("/", validateExpense, async (req, res, next) => {
  try {
    const { amount, category, note, date } = req.body;

    const expense = await Expense.create({
      userId: req.user._id,
      amount,
      category,
      note,
      date,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
});

// ── GET /api/expenses/:id ─────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findOne({
      _id: req.params.id,
      userId: req.user._id,   // scoped to authenticated user
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found." });
    }

    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
});

// ── PUT /api/expenses/:id ─────────────────────────────────────────────────────
router.put("/:id", validateExpenseUpdate, async (req, res, next) => {
  try {
    const { amount, category, note, date } = req.body;

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id }, // scoped to authenticated user
      { amount, category, note, date },
      { new: true, runValidators: true, omitUndefined: true }
    );

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found." });
    }

    res.json({ success: true, data: expense });
  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/expenses/:id ──────────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,   // scoped to authenticated user
    });

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found." });
    }

    res.json({ success: true, message: "Expense deleted.", data: expense });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
