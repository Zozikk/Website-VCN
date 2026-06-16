import { Router } from 'express';

export function createAuthRouter({ authController, authMiddleware }) {
  const router = Router();

  router.post('/login', authController.login);
  router.post('/authorize', authMiddleware.requireSession, authController.authorize);
  router.post('/logout', authController.logout);
  router.post('/token', authController.token);
  router.get('/me', authController.me);

  return router;
}