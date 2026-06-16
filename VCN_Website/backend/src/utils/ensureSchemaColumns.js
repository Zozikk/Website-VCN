const { sequelize } = require("../models");

const PAGE_COLUMNS = [
  { name: "page_type", sql: "ALTER TABLE pages ADD COLUMN page_type TEXT NOT NULL DEFAULT 'page'" },
  { name: "is_system", sql: "ALTER TABLE pages ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0" },
  { name: "html_content", sql: "ALTER TABLE pages ADD COLUMN html_content TEXT NOT NULL DEFAULT ''" },
  { name: "css_content", sql: "ALTER TABLE pages ADD COLUMN css_content TEXT" },
  { name: "js_content", sql: "ALTER TABLE pages ADD COLUMN js_content TEXT" },
  { name: "rendered_html", sql: "ALTER TABLE pages ADD COLUMN rendered_html TEXT NOT NULL DEFAULT ''" },
  { name: "rendered_css", sql: "ALTER TABLE pages ADD COLUMN rendered_css TEXT" },
  { name: "rendered_js", sql: "ALTER TABLE pages ADD COLUMN rendered_js TEXT" },
  { name: "version", sql: "ALTER TABLE pages ADD COLUMN version INTEGER NOT NULL DEFAULT 1" },
];

const ensurePageColumns = async () => {
  const [tableInfo] = await sequelize.query("PRAGMA table_info('pages')");
  const existing = new Set(tableInfo.map((column) => column.name));

  for (const column of PAGE_COLUMNS) {
    if (!existing.has(column.name)) {
      await sequelize.query(column.sql);
    }
  }
};

module.exports = {
  ensurePageColumns,
};
