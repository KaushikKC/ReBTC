module.exports = (sequelize, DataTypes) => {
  const ApyRate = sequelize.define(
    "ApyRate",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      asset: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      rate: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0,
      },
      updatedBy: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );

  return ApyRate;
};
