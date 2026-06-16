const { DataTypes, Model } = require("sequelize");

class Page extends Model {}

const initPageModel = (sequelize) => {
  Page.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      pageType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "page",
        validate: {
          isIn: [["page", "global_header", "global_footer"]],
        },
      },
      isSystem: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      metaTitle: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      metaDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      h1: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      htmlContent: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      cssContent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      jsContent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      renderedHtml: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "",
      },
      renderedCss: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      renderedJs: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      version: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastEditedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Page",
      tableName: "pages",
      underscored: true,
      timestamps: true,
    },
  );

  return Page;
};

module.exports = initPageModel;
