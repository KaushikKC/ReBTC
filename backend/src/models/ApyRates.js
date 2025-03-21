export default (sequelize, DataTypes) => {
  return sequelize.define("ApyRates", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    asset: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rate: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.STRING,
    },
  });
};
