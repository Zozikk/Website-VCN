export function createHealthRepository(database) {
  return {
    async ping() {
      const rows = await database.query('SELECT 1 AS ok');
      return rows[0]?.ok === 1;
    },
  };
}