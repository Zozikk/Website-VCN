import { createStoreRepository } from '../../repositories/store.repository.js';
import { createAuthService as createService } from '../../services/auth.service.js';

export function createAuthService({ store, env }) {
  const repos = createStoreRepository(store);
  return createService({ repos, env });
}