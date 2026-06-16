import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

dotenv.config();

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(currentDirectory, '..', '..');
const projectRoot = path.resolve(backendRoot, '..');

function parseCsv(value) {
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  corsOrigins: parseCsv(process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:5174'),
  database: {
    client: process.env.DB_CLIENT || 'sqlite',
    filePath: path.resolve(projectRoot, process.env.DB_FILE || '.data/app.sqlite'),
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'dev-auth-secret-change-me',
    codeTtlSeconds: Number(process.env.AUTH_CODE_TTL_SECONDS || 60),
    sessionCookieName: process.env.SESSION_COOKIE_NAME || 'auth_session',
    accessCookieName: process.env.ACCESS_COOKIE_NAME || 'jwt_token',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  },
};