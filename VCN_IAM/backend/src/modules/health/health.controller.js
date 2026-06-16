export function createHealthController({ healthService }) {
  return {
    async getHealth(request, response, next) {
      try {
        const payload = await healthService.getHealth();
        response.status(200).json(payload);
      } catch (error) {
        next(error);
      }
    },
  };
}