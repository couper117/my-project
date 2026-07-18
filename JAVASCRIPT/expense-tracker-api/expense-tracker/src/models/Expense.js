const mongoose = require("mongoose");

const CATEGORIES = ["food", "transport", "utilities", "other"];

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "userId is required"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
      min: [0.01, "amount must be greater than 0"],
    },
    category: {
      type: String,
      enum: {
        values: CATEGORIES,
        message: `category must be one of: ${CATEGORIES.join(", ")}`,
      },
      required: [true, "category is required"],
    },
    note: {
      type: String,
      maxlength: [200, "note must be 200 characters or fewer"],
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);
