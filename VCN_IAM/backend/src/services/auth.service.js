import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function sanitizeUser(user) {
  return user
    ? {
        id: user.id,
        email: user.email,
        createdAt: user.created_at,
      }
    : null;
}

function normalizeId(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

export function createAuthService({ repos, env }) {
  const store = repos;

  return {
    login({ email, password }) {
      const user = store.findUserByEmail(email);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
      }

      const role = store.userHasAdminAccess(user.id) ? 'admin' : 'user';
      const token = jwt.sign(
        {
          kind: 'session',
          sub: user.id,
          email: user.email,
          role,
        },
        env.auth.jwtSecret,
        { expiresIn: '2h' },
      );

      return {
        token,
        user: sanitizeUser(user),
        role,
      };
    },
    authorize({ userId, appId, redirectUri }) {
      const normalizedAppId = normalizeId(appId);
      const user = store.findUserById(userId);
      let app = store.findApplicationById(normalizedAppId);

      if (!app && redirectUri) {
        app = store.findApplicationByRedirectUri(redirectUri);
      }

      if (!user) {
        const error = new Error('User session not found');
        error.statusCode = 401;
        throw error;
      }

      if (!app) {
        const error = new Error('Application not found');
        error.statusCode = 404;
        throw error;
      }

      const resolvedAppId = app.id;

      if (redirectUri && redirectUri !== app.allowed_redirect) {
        const error = new Error('Redirect URI is not allowed for this application');
        error.statusCode = 400;
        throw error;
      }

      if (!store.userHasAppAccess(user.id, resolvedAppId) && !store.userHasAdminAccess(user.id)) {
        const error = new Error('User does not have access to this application');
        error.statusCode = 403;
        throw error;
      }

      const code = crypto.randomBytes(24).toString('hex');
      const expiresAt = Date.now() + env.auth.codeTtlSeconds * 1000;

      store.createAuthCode({ code, userId: user.id, appId: resolvedAppId, expiresAt });

      return {
        code,
        appId: resolvedAppId,
        redirectUri: app.allowed_redirect,
        expiresAt,
      };
    },
    exchangeCode({ code, appId, secretKey }) {
      const normalizedAppId = normalizeId(appId);
      const app = store.findApplicationById(normalizedAppId);

      if (!app || app.secret_key !== secretKey) {
        const error = new Error('Invalid application credentials');
        error.statusCode = 401;
        throw error;
      }

      const authCode = store.consumeAuthCode({ code, appId: normalizedAppId });

      if (!authCode) {
        const error = new Error('Invalid or expired authorization code');
        error.statusCode = 400;
        throw error;
      }

      if (authCode.expires_at <= Date.now()) {
        store.deleteAuthCode(code);
        const error = new Error('Authorization code expired');
        error.statusCode = 400;
        throw error;
      }

      const user = store.findUserById(authCode.user_id);
      const permission = store.findPermission(user.id, app.id);
      const role = permission?.role || 'user';

      const token = jwt.sign(
        {
          kind: 'access',
          sub: user.id,
          email: user.email,
          role,
          appId: app.id,
        },
        env.auth.jwtSecret,
        { expiresIn: '1h' },
      );

      return {
        token,
        user: sanitizeUser(user),
        app: {
          id: app.id,
          name: app.name,
        },
        role,
      };
    },
    getCurrentUserFromToken(token) {
      if (!token) {
        return null;
      }

      try {
        const payload = jwt.verify(token, env.auth.jwtSecret);
        const user = store.findUserById(payload.sub);

        if (!user) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: payload.role,
          kind: payload.kind,
          appId: payload.appId || null,
          createdAt: user.created_at,
        };
      } catch {
        return null;
      }
    },
    requireSession(request) {
      const sessionToken = request.cookies[env.auth.sessionCookieName] || request.cookies[env.auth.accessCookieName];
      const user = this.getCurrentUserFromToken(sessionToken);

      if (!user) {
        const error = new Error('Authentication required');
        error.statusCode = 401;
        throw error;
      }

      return user;
    },
  };
}
