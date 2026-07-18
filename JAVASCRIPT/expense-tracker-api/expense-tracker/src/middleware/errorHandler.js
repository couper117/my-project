// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  console.error(err);

  // Mongoose duplicate-key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(409)
      .json({ success: false, message: `${field} is already in use.` });
  }

  // Mongoose validation errors
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join("; ");
    return res.status(400).json({ success: false, message });
  }

  // Mongoose cast errors (bad ObjectId)
  if (err.name === "CastError") {
    return res
      .status(400)
      .json({ success: false, message: `Invalid value for field: ${err.path}` });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";
  res.status(statusCode).json({ success: false, message });
};

module.exports = { errorHandler };
