export function createHealthService({ healthRepository }) {
  return {
    async getHealth() {
      const databaseReady = await healthRepository.ping();

      return {
        message: 'API is healthy',
        status: databaseReady ? 'ok' : 'degraded',
        database: {
          status: databaseReady ? 'connected' : 'unavailable',
        },
        uptime: process.uptime(),
      };
    },
  };
}