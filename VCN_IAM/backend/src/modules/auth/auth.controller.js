export function createAuthController({ authService, env }) {
  return {
    login(request, response, next) {
      try {
        const { email, password } = request.body;
        const result = authService.login({ email, password });

        response.cookie(env.auth.sessionCookieName, result.token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: env.auth.cookieSecure,
          path: '/',
        });

        response.status(200).json({
          user: result.user,
          role: result.role,
        });
      } catch (error) {
        next(error);
      }
    },
    authorize(request, response, next) {
      try {
        const user = authService.requireSession(request);
        const { appId, redirectUri } = request.body;
        const result = authService.authorize({ userId: user.id, appId, redirectUri });

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
    token(request, response, next) {
      try {
        const { code, appId, secretKey } = request.body;
        const result = authService.exchangeCode({ code, appId, secretKey });

        response.status(200).json(result);
      } catch (error) {
        next(error);
      }
    },
    logout(request, response) {
      response.clearCookie(env.auth.sessionCookieName, { path: '/' });
      response.clearCookie(env.auth.accessCookieName, { path: '/' });
      response.status(200).json({ message: 'Logged out' });
    },
    me(request, response) {
      const token = request.cookies[env.auth.sessionCookieName] || request.cookies[env.auth.accessCookieName];
      const user = authService.getCurrentUserFromToken(token);

      if (!user) {
        response.status(401).json({ message: 'Not authenticated' });
        return;
      }

      response.status(200).json({ user });
    },
  };
}