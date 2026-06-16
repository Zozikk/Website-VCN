const sequelize = require("../config/database");
const initUserModel = require("./User");
const initPageModel = require("./Page");
const initPageVersionModel = require("./PageVersion");
const initRedirectRuleModel = require("./RedirectRule");
const initTagModel = require("./Tag");
const initPageTagModel = require("./PageTag");

const User = initUserModel(sequelize);
const Page = initPageModel(sequelize);
const PageVersion = initPageVersionModel(sequelize);
const RedirectRule = initRedirectRuleModel(sequelize);
const Tag = initTagModel(sequelize);
const PageTag = initPageTagModel(sequelize);

Page.belongsTo(User, {
  as: "lastEditor",
  foreignKey: "lastEditedById",
});

User.hasMany(Page, {
  as: "editedPages",
  foreignKey: "lastEditedById",
});

Page.hasMany(PageVersion, {
  as: "versions",
  foreignKey: "pageId",
});

PageVersion.belongsTo(Page, {
  as: "page",
  foreignKey: "pageId",
});

User.hasMany(PageVersion, {
  as: "pageVersionEdits",
  foreignKey: "editedById",
});

PageVersion.belongsTo(User, {
  as: "editedBy",
  foreignKey: "editedById",
});

User.hasMany(RedirectRule, {
  as: "createdRedirectRules",
  foreignKey: "createdById",
});

RedirectRule.belongsTo(User, {
  as: "createdBy",
  foreignKey: "createdById",
});

Page.belongsToMany(Tag, {
  as: "tags",
  through: PageTag,
  foreignKey: "pageId",
  otherKey: "tagId",
});

Tag.belongsToMany(Page, {
  as: "pages",
  through: PageTag,
  foreignKey: "tagId",
  otherKey: "pageId",
});

module.exports = {
  sequelize,
  User,
  Page,
  PageVersion,
  RedirectRule,
  Tag,
  PageTag,
};
