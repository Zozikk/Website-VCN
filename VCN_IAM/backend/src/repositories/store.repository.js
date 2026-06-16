export function createStoreRepository(store) {
  return {
    close() {
      return store.close();
    },
    findUserByEmail(email) {
      return store.findUserByEmail(email);
    },
    findUserById(id) {
      return store.findUserById(id);
    },
    listUsers() {
      return store.listUsers();
    },
    createUser(opts) {
      return store.createUser(opts);
    },
    listApps() {
      return store.listApps();
    },
    findApplicationById(id) {
      return store.findApplicationById(id);
    },
    findApplicationByRedirectUri(redirectUri) {
      return store.findApplicationByRedirectUri(redirectUri);
    },
    createApplication(opts) {
      return store.createApplication(opts);
    },
    listPermissions() {
      return store.listPermissions();
    },
    findPermission(userId, appId) {
      return store.findPermission(userId, appId);
    },
    userHasAdminAccess(userId) {
      return store.userHasAdminAccess(userId);
    },
    userHasAppAccess(userId, appId) {
      return store.userHasAppAccess(userId, appId);
    },
    createPermission(opts) {
      return store.createPermission(opts);
    },
    createAuthCode(opts) {
      return store.createAuthCode(opts);
    },
    consumeAuthCode(opts) {
      return store.consumeAuthCode(opts);
    },
    deleteAuthCode(code) {
      return store.deleteAuthCode(code);
    },
  };
}
