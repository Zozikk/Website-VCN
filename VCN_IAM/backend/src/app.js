import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { createStore } from './database/store.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthController } from './modules/auth/auth.controller.js';
import { createAdminService } from './modules/admin/admin.service.js';
import { createAuthMiddleware } from './middlewares/auth.middleware.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createAdminRouter } from './routes/admin.routes.js';

function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;

  response.status(statusCode).json({
    message: error.message || 'Internal server error',
  });
}

export async function createApp() {
  const store = createStore(env.database.filePath);
  const authService = createAuthService({ store, env });
  const adminService = createAdminService({ store, env });
  const authMiddleware = createAuthMiddleware({ authService, store });
  const authController = createAuthController({ authService, env });

  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (request, response) => {
    response.json({
      message: 'Auth server is healthy',
      database: 'ready',
    });
  });

  app.get('/api/auth/me', authController.me);
  app.use('/api/auth', createAuthRouter({ authController, authMiddleware }));
  app.use('/api/admin', createAdminRouter({ adminService, authMiddleware }));

  app.use((request, response) => {
    response.status(404).json({
      message: 'Route not found',
      path: request.originalUrl,
    });
  });
  app.use(errorHandler);

  return { app, store };
}