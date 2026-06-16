import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

function nowIso() {
  return new Date().toISOString();
}

function createSchema(database) {
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      allowed_redirect TEXT NOT NULL,
      secret_key TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      app_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, app_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(app_id) REFERENCES applications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS auth_codes (
      code TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      app_id INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(app_id) REFERENCES applications(id) ON DELETE CASCADE
    );
  `);
}

const CMS_APP = {
  name: 'VCN CMS',
  allowedRedirect: 'http://localhost:3000/callback',
  secretKey: 'cms-app-dev-secret',
};

const DEMO_STORE_APP = {
  name: 'Demo Store',
  allowedRedirect: 'http://localhost:5174/callback',
  secretKey: 'store-app-dev-secret',
};

function ensureApplication(database, appConfig) {
  const existing = database
    .prepare('SELECT id FROM applications WHERE secret_key = ?')
    .get(appConfig.secretKey);

  if (existing) {
    return existing.id;
  }

  const createdAt = nowIso();
  const result = database
    .prepare('INSERT INTO applications (name, allowed_redirect, secret_key, created_at) VALUES (?, ?, ?, ?)')
    .run(appConfig.name, appConfig.allowedRedirect, appConfig.secretKey, createdAt);

  const appId = result.lastInsertRowid;
  const users = database.prepare('SELECT id FROM users ORDER BY id ASC').all();
  const createPermission = database.prepare(
    'INSERT OR IGNORE INTO permissions (user_id, app_id, role, created_at) VALUES (?, ?, ?, ?)',
  );

  for (const user of users) {
    const role = user.id === users[0]?.id ? 'admin' : 'editor';
    createPermission.run(user.id, appId, role, createdAt);
  }

  return appId;
}

function ensureDefaultApplications(database) {
  ensureApplication(database, CMS_APP);
  ensureApplication(database, DEMO_STORE_APP);
}

function seedDatabase(database) {
  const userCount = database.prepare('SELECT COUNT(*) AS count FROM users').get().count;

  if (userCount > 0) {
    ensureDefaultApplications(database);
    return;
  }

  const createUser = database.prepare(
    'INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)',
  );
  const createApp = database.prepare(
    'INSERT INTO applications (name, allowed_redirect, secret_key, created_at) VALUES (?, ?, ?, ?)',
  );
  const createPermission = database.prepare(
    'INSERT INTO permissions (user_id, app_id, role, created_at) VALUES (?, ?, ?, ?)',
  );

  const passwordHash = bcrypt.hashSync('Kacper123!', 10);
  const createdAt = nowIso();

  const adminUser = createUser.run('kacper.witczak@vcn.pl', passwordHash, createdAt);
  const cmsApp = createApp.run(
    CMS_APP.name,
    CMS_APP.allowedRedirect,
    CMS_APP.secretKey,
    createdAt,
  );
  const demoApp = createApp.run(
    DEMO_STORE_APP.name,
    DEMO_STORE_APP.allowedRedirect,
    DEMO_STORE_APP.secretKey,
    createdAt,
  );

  createPermission.run(adminUser.lastInsertRowid, cmsApp.lastInsertRowid, 'admin', createdAt);
  createPermission.run(adminUser.lastInsertRowid, demoApp.lastInsertRowid, 'admin', createdAt);
}

export function createStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const database = new Database(filePath);
  createSchema(database);
  seedDatabase(database);

  return {
    close() {
      database.close();
    },
    findUserByEmail(email) {
      return database.prepare('SELECT * FROM users WHERE email = ?').get(email);
    },
    findUserById(id) {
      return database.prepare('SELECT * FROM users WHERE id = ?').get(id);
    },
    listUsers() {
      return database.prepare('SELECT id, email, created_at FROM users ORDER BY id ASC').all();
    },
    createUser({ email, passwordHash }) {
      const result = database
        .prepare('INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)')
        .run(email, passwordHash, nowIso());

      return this.findUserById(result.lastInsertRowid);
    },
    updateUser(id, { email, passwordHash }) {
      if (passwordHash) {
        return database
          .prepare('UPDATE users SET email = ?, password_hash = ? WHERE id = ?')
          .run(email, passwordHash, id);
      }

      return database.prepare('UPDATE users SET email = ? WHERE id = ?').run(email, id);
    },
    deleteUser(id) {
      return database.prepare('DELETE FROM users WHERE id = ?').run(id);
    },
    listApps() {
      return database
        .prepare('SELECT id, name, allowed_redirect, secret_key, created_at FROM applications ORDER BY id ASC')
        .all();
    },
    findApplicationById(id) {
      return database.prepare('SELECT * FROM applications WHERE id = ?').get(id);
    },
    findApplicationByRedirectUri(redirectUri) {
      return database.prepare('SELECT * FROM applications WHERE allowed_redirect = ?').get(redirectUri);
    },
    createApplication({ name, allowedRedirect, secretKey }) {
      const result = database
        .prepare(
          'INSERT INTO applications (name, allowed_redirect, secret_key, created_at) VALUES (?, ?, ?, ?)',
        )
        .run(name, allowedRedirect, secretKey, nowIso());

      return this.findApplicationById(result.lastInsertRowid);
    },
    updateApplication(id, { name, allowedRedirect }) {
      return database
        .prepare('UPDATE applications SET name = ?, allowed_redirect = ? WHERE id = ?')
        .run(name, allowedRedirect, id);
    },
    deleteApplication(id) {
      return database.prepare('DELETE FROM applications WHERE id = ?').run(id);
    },
    listPermissions() {
      return database
        .prepare(
          `SELECT permissions.id, permissions.user_id, permissions.app_id, permissions.role, users.email AS user_email, applications.name AS app_name
           FROM permissions
           JOIN users ON users.id = permissions.user_id
           JOIN applications ON applications.id = permissions.app_id
           ORDER BY permissions.id ASC`,
        )
        .all();
    },
    findPermission(userId, appId) {
      return database
        .prepare('SELECT * FROM permissions WHERE user_id = ? AND app_id = ?')
        .get(userId, appId);
    },
    userHasAdminAccess(userId) {
      const row = database
        .prepare("SELECT 1 AS ok FROM permissions WHERE user_id = ? AND role = 'admin' LIMIT 1")
        .get(userId);

      return Boolean(row);
    },
    userHasAppAccess(userId, appId) {
      return Boolean(this.findPermission(userId, appId));
    },
    createPermission({ userId, appId, role }) {
      return database
        .prepare('INSERT OR REPLACE INTO permissions (user_id, app_id, role, created_at) VALUES (?, ?, ?, ?)')
        .run(userId, appId, role, nowIso());
    },
    findPermissionById(id) {
      return database.prepare('SELECT * FROM permissions WHERE id = ?').get(id);
    },
    updatePermission(id, { role }) {
      return database.prepare('UPDATE permissions SET role = ? WHERE id = ?').run(role, id);
    },
    deletePermission(id) {
      return database.prepare('DELETE FROM permissions WHERE id = ?').run(id);
    },
    createAuthCode({ code, userId, appId, expiresAt }) {
      return database
        .prepare('INSERT INTO auth_codes (code, user_id, app_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(code, userId, appId, expiresAt, nowIso());
    },
    consumeAuthCode({ code, appId }) {
      const select = database
        .prepare('SELECT * FROM auth_codes WHERE code = ? AND app_id = ?')
        .get(code, appId);

      if (!select) {
        return null;
      }

      database.prepare('DELETE FROM auth_codes WHERE code = ?').run(code);
      return select;
    },
    deleteAuthCode(code) {
      database.prepare('DELETE FROM auth_codes WHERE code = ?').run(code);
    },
  };
}