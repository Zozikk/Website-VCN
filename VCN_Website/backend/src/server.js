const app = require("./app");
const env = require("./config/env");
const { sequelize } = require("./models");
const seedDefaultAdmin = require("./utils/seedDefaultAdmin");
const { ensurePageColumns } = require("./utils/ensureSchemaColumns");

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    await ensurePageColumns();
    await seedDefaultAdmin();
    await require("./utils/seedDefaultTags")();

    app.listen(env.port, () => {
      console.log(`Backend API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start backend server:", error);
    process.exit(1);
  }
};

startServer();