export function createAuthMiddleware({ authService, store }) {
  return {
    requireSession(request, response, next) {
      try {
        request.authUser = authService.requireSession(request);
        next();
      } catch (error) {
        next(error);
      }
    },
    requireAdmin(request, response, next) {
      try {
        const sessionUser = authService.requireSession(request);

        if (!store.userHasAdminAccess(sessionUser.id)) {
          const error = new Error('Admin access required');
          error.statusCode = 403;
          throw error;
        }

        request.authUser = sessionUser;
        next();
      } catch (error) {
        next(error);
      }
    },
  };
}