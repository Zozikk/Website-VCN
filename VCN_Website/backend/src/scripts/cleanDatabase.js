/**
 * Clean Database Script
 * Deletes all records from the database (pages, versions, redirects, users, tags)
 */

const { sequelize, User, Page, PageVersion, RedirectRule, Tag, PageTag } = require("../models");

const cleanDatabase = async () => {
  try {
    console.log("Starting database cleanup...");

    await PageTag.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all page tags");

    await PageVersion.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all page versions");

    await RedirectRule.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all redirect rules");

    await Page.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all pages");

    await Tag.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all tags");

    await User.destroy({ where: {}, truncate: true, cascade: true });
    console.log("Deleted all users");

    console.log("Database cleanup complete. Restart the server to re-seed default data.");
    process.exit(0);
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
};

cleanDatabase();
