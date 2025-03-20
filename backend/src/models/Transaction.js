export default (sequelize, DataTypes) => {
  return sequelize.define("Transaction", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    txHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAddress: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    reBtcAmount: {
      type: DataTypes.FLOAT,
    },
    stablecoinAmount: {
      type: DataTypes.FLOAT,
    },
    stablecoinType: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  });
};
