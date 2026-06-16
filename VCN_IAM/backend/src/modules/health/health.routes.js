import { Router } from 'express';

export function createHealthRouter({ healthController }) {
  const router = Router();

  router.get('/', (request, response, next) => healthController.getHealth(request, response, next));

  return router;
}