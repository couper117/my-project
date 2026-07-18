const Joi = require("joi");

// ── Helpers ───────────────────────────────────────────────────────────────────
const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({ success: false, message });
  }
  next();
};

// ── Schemas ───────────────────────────────────────────────────────────────────
const registerSchema = Joi.object({
  name: Joi.string().min(1).max(100).required().messages({
    "string.empty": "name is required",
    "any.required": "name is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "email must be a valid email address",
    "any.required": "email is required",
  }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.min": "password must be at least 6 characters",
    "any.required": "password is required",
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "email must be a valid email address",
    "any.required": "email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "password is required",
  }),
});

const expenseSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.positive": "amount must be a positive number",
    "any.required": "amount is required",
  }),
  category: Joi.string()
    .valid("food", "transport", "utilities", "other")
    .required()
    .messages({
      "any.only": "category must be one of: food, transport, utilities, other",
      "any.required": "category is required",
    }),
  note: Joi.string().max(200).allow("").optional().messages({
    "string.max": "note must be 200 characters or fewer",
  }),
  date: Joi.date().iso().optional().messages({
    "date.format": "date must be a valid ISO date",
  }),
});

const expenseUpdateSchema = Joi.object({
  amount: Joi.number().positive().messages({
    "number.positive": "amount must be a positive number",
  }),
  category: Joi.string()
    .valid("food", "transport", "utilities", "other")
    .messages({
      "any.only": "category must be one of: food, transport, utilities, other",
    }),
  note: Joi.string().max(200).allow("").optional().messages({
    "string.max": "note must be 200 characters or fewer",
  }),
  date: Joi.date().iso().optional().messages({
    "date.format": "date must be a valid ISO date",
  }),
}).min(1); // at least one field required for an update

// ── Exports ───────────────────────────────────────────────────────────────────
module.exports = {
  validateRegister: validate(registerSchema),
  validateLogin: validate(loginSchema),
  validateExpense: validate(expenseSchema),
  validateExpenseUpdate: validate(expenseUpdateSchema),
};
