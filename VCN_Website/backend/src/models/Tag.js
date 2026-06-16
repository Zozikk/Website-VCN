const { DataTypes, Model } = require("sequelize");

class Tag extends Model {}

const initTagModel = (sequelize) => {
  Tag.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Tag",
      tableName: "tags",
      underscored: true,
      timestamps: true,
    },
  );

  return Tag;
};

module.exports = initTagModel;
