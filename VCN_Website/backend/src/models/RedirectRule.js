const { DataTypes, Model } = require("sequelize");

class RedirectRule extends Model {}

const initRedirectRuleModel = (sequelize) => {
  RedirectRule.init(
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      fromPath: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      toPath: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      statusCode: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 301,
        validate: {
          isIn: [[301, 302, 307, 308]],
        },
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdById: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "RedirectRule",
      tableName: "redirect_rules",
      underscored: true,
      timestamps: true,
    },
  );

  return RedirectRule;
};

module.exports = initRedirectRuleModel;
