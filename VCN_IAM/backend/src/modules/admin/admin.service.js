import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';

export function createAdminService({ store }) {
  return {
    listPermissions() {
      return store.listPermissions().map((permission) => ({
        id: permission.id,
        userId: permission.user_id,
        appId: permission.app_id,
        role: permission.role,
        userEmail: permission.user_email,
        appName: permission.app_name,
      }));
    },
    listUsers() {
      const users = store.listUsers();
      const permissions = this.listPermissions();

      return users.map((user) => ({
        ...user,
        permissions: permissions
          .filter((permission) => permission.userId === user.id)
          .map((permission) => ({
            appId: permission.appId,
            appName: permission.appName,
            role: permission.role,
          })),
      }));
    },
    createUser({ email, password, appId, role }) {
      const passwordHash = bcrypt.hashSync(password, 10);
      const user = store.createUser({ email, passwordHash });

      if (appId && role) {
        store.createPermission({ userId: user.id, appId: Number(appId), role });
      }

      return user;
    },
    listApps() {
      return store.listApps();
    },
    createApp({ name, allowedRedirect }) {
      const secretKey = crypto.randomBytes(24).toString('hex');
      return store.createApplication({ name, allowedRedirect, secretKey });
    },
    assignPermission({ userId, appId, role }) {
      return store.createPermission({ userId: Number(userId), appId: Number(appId), role });
    },
    deletePermission(id) {
      return store.deletePermission(Number(id));
    },
    deleteUser(id) {
      return store.deleteUser(Number(id));
    },
    deleteApp(id) {
      return store.deleteApplication(Number(id));
    },
    updateUser({ id, email, password }) {
      const user = store.findUserById(Number(id));

      if (!user) {
        const error = new Error('User not found');
        error.status = 404;
        throw error;
      }

      const passwordHash = password ? bcrypt.hashSync(password, 10) : null;
      store.updateUser(Number(id), { email, passwordHash });

      return store.findUserById(Number(id));
    },
    updateApp({ id, name, allowedRedirect }) {
      const app = store.findApplicationById(Number(id));

      if (!app) {
        const error = new Error('Application not found');
        error.status = 404;
        throw error;
      }

      store.updateApplication(Number(id), { name, allowedRedirect });

      return store.findApplicationById(Number(id));
    },
    updatePermission({ id, role }) {
      const permission = store.findPermissionById(Number(id));

      if (!permission) {
        const error = new Error('Permission not found');
        error.status = 404;
        throw error;
      }

      store.updatePermission(Number(id), { role });

      return store.findPermissionById(Number(id));
    },
  };
}