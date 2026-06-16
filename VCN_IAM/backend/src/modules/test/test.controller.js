export function createTestController({ testService }) {
  return {
    getMessage(request, response) {
      response.status(200).json(testService.getMessage());
    },
  };
}