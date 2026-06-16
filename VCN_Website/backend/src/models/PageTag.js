const { DataTypes, Model } = require("sequelize");

class PageTag extends Model {}

const initPageTagModel = (sequelize) => {
  PageTag.init(
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
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "PageTag",
      tableName: "page_tags",
      underscored: true,
      timestamps: false,
      indexes: [
        {
          unique: true,
          fields: ["page_id", "tag_id"],
        },
      ],
    },
  );

  return PageTag;
};

module.exports = initPageTagModel;
