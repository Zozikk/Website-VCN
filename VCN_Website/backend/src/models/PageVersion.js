const { DataTypes, Model } = require("sequelize");

class PageVersion extends Model {}

const initPageVersionModel = (sequelize) => {
  PageVersion.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      pageId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      versionNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
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
      isPublished: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      editedById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "PageVersion",
      tableName: "page_versions",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          fields: ["page_id", "version_number"],
          unique: true,
        },
      ],
    },
  );

  return PageVersion;
};

module.exports = initPageVersionModel;
