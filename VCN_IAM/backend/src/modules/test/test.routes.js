import { Router } from 'express';

export function createTestRouter({ testController }) {
  const router = Router();

  router.get('/', (request, response) => testController.getMessage(request, response));

  return router;
}