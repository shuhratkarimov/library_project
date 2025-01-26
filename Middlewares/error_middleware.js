const BaseError = require("../Utils/base_error")

module.exports = (err, req, res, next) => {
  // Xatolik BaseError da bo'lsa
  if (err instanceof BaseError) {
    res.status(err.status).json({
      message: err.message,
      errors: err.errors,
    });
    return;
  }
  // Xatolik Mongoosening ValidationErrorda bo'lsa
  if (err.name === "ValidationError") {
    const errorMessages = Object.values(err.errors).map(
      (error) => error.message
    );
    res.status(400).json({
      message: "Validation Error",
      errors: errorMessages,
    });
  }
  // Xatolik MongoDB noyoblik xatolaridan bo'lsa
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(", ");
    res.status(400).json({
      message: `Duplicate value for fields: ${fields}`,
      errors: errorMessages,
    });
  }
  // JWT yoki authentication bilan bog'liq xatoliklar
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      message: `Invalid Token`,
    });
    return;
  }
  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      message: `Token has expired`,
    });
    return;
  }
  // Umumiy xatoliklar uchun
  res.status(500).json({
    message: "Server error",
    errors: [err.message || "Unexpected error occured"],
  });
};
