export function createTestService() {
  return {
    getMessage() {
      return {
        message: 'Test endpoint is working',
        version: 'v1',
      };
    },
  };
}