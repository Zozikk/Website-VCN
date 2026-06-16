const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  previewTokenSecret: process.env.PREVIEW_TOKEN_SECRET || process.env.JWT_SECRET || "change-preview-secret",
  previewTokenExpiresIn: process.env.PREVIEW_TOKEN_EXPIRES_IN || "15m",
  dbStoragePath: process.env.DB_STORAGE_PATH || "./database.sqlite",
  corsOrigins: (process.env.CORS_ORIGIN || "http://localhost:3000,http://localhost:3001")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  frontendBaseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:3000",
  revalidateSecret: process.env.REVALIDATE_SECRET || process.env.NEXT_REVALIDATE_SECRET || "change-me-revalidate-secret",
  authServerUrl: process.env.AUTH_SERVER_URL || process.env.OAUTH_BASE_URL || "http://localhost:4000",
  clientAppId: Number(process.env.CLIENT_APP_ID || process.env.OAUTH_CLIENT_ID || 3),
  clientSecretKey: process.env.CLIENT_SECRET_KEY || process.env.OAUTH_CLIENT_SECRET || "cms-app-dev-secret",
};

module.exports = env;
