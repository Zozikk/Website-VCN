const { Sequelize } = require("sequelize");
const env = require("./env");

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: env.dbStoragePath,
  logging: env.nodeEnv === "development" ? console.log : false,
});

module.exports = sequelize;