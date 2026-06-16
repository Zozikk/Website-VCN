const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  console.error(
    JSON.stringify({
      type: "request-error",
      method: req.method,
      path: req.originalUrl,
      message: err.message || "Unknown error",
      statusCode: err.statusCode || 500,
    }),
  );

  return res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error.",
  });
};

module.exports = errorMiddleware;
