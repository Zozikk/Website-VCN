import { Router } from 'express';

function handleServiceError(response, error) {
  response.status(error.status || 500).json({ message: error.message || 'Request failed' });
}

export function createAdminRouter({ adminService, authMiddleware }) {
  const router = Router();

  router.get('/users', authMiddleware.requireAdmin, (request, response) => {
    response.json({ users: adminService.listUsers() });
  });

  router.post('/users', authMiddleware.requireAdmin, (request, response) => {
    const { email, password, appId, role } = request.body;
    const user = adminService.createUser({ email, password, appId, role });
    response.status(201).json({ user });
  });

  router.put('/users/:id', authMiddleware.requireAdmin, (request, response) => {
    try {
      const { email, password } = request.body;
      const user = adminService.updateUser({ id: request.params.id, email, password });
      response.json({ user });
    } catch (error) {
      handleServiceError(response, error);
    }
  });

  router.delete('/users/:id', authMiddleware.requireAdmin, (request, response) => {
    adminService.deleteUser(request.params.id);
    response.status(204).end();
  });

  router.get('/apps', authMiddleware.requireAdmin, (request, response) => {
    response.json({ apps: adminService.listApps() });
  });

  router.post('/apps', authMiddleware.requireAdmin, (request, response) => {
    const { name, allowedRedirect } = request.body;
    const app = adminService.createApp({ name, allowedRedirect });
    response.status(201).json({ app });
  });

  router.put('/apps/:id', authMiddleware.requireAdmin, (request, response) => {
    try {
      const { name, allowedRedirect } = request.body;
      const app = adminService.updateApp({ id: request.params.id, name, allowedRedirect });
      response.json({ app });
    } catch (error) {
      handleServiceError(response, error);
    }
  });

  router.delete('/apps/:id', authMiddleware.requireAdmin, (request, response) => {
    adminService.deleteApp(request.params.id);
    response.status(204).end();
  });

  router.get('/permissions', authMiddleware.requireAdmin, (request, response) => {
    response.json({ permissions: adminService.listPermissions() });
  });

  router.post('/permissions', authMiddleware.requireAdmin, (request, response) => {
    const { userId, appId, role } = request.body;
    adminService.assignPermission({ userId, appId, role });
    response.status(201).json({ message: 'Permission assigned' });
  });

  router.put('/permissions/:id', authMiddleware.requireAdmin, (request, response) => {
    try {
      const { role } = request.body;
      const permission = adminService.updatePermission({ id: request.params.id, role });
      response.json({ permission });
    } catch (error) {
      handleServiceError(response, error);
    }
  });

  router.delete('/permissions/:id', authMiddleware.requireAdmin, (request, response) => {
    adminService.deletePermission(request.params.id);
    response.status(204).end();
  });

  return router;
}
