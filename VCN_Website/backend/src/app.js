const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const env = require("./config/env");
const authRoutes = require("./routes/authRoutes");
const pageRoutes = require("./routes/pageRoutes");
const redirectRoutes = require("./routes/redirectRoutes");
const errorMiddleware = require("./middlewares/errorMiddleware");
const requestMetricsMiddleware = require("./middlewares/requestMetricsMiddleware");

const app = express();

const corsOptions = {
  origin: env.corsOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "1mb" }));

// Manual cookie parsing middleware as temporary workaround
app.use((req, res, next) => {
  const cookies = {};
  if (req.headers.cookie) {
    req.headers.cookie.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) cookies[name] = decodeURIComponent(value);
    });
  }
  req.cookies = cookies;
  next();
});

app.use(requestMetricsMiddleware);

app.get("/health", (req, res) => {
  return res.json({ status: "ok" });
});

app.get("/health/ready", async (req, res) => {
  return res.json({
    status: "ready",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/pages", pageRoutes);
app.use("/api/redirects", redirectRoutes);
app.use("/api/tags", require("./routes/tagRoutes"));

app.use(errorMiddleware);

module.exports = app;
