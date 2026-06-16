const requestMetricsMiddleware = (req, res, next) => {
  const startedAt = Date.now();
  const requestId = `${startedAt}-${Math.random().toString(36).slice(2, 10)}`;

  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    console.log(
      JSON.stringify({
        type: "request-metric",
        requestId,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      }),
    );
  });

  next();
};

module.exports = requestMetricsMiddleware;
