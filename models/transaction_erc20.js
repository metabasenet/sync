
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const TransactionErc20 = sequelize.define('transaction_erc20', {
    transactionHash: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    blockHash: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    blockNumber: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    contractAddress: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    from: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    to: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    value: {
      type: DataTypes.DECIMAL(65,0),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'transaction_erc20',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "transactionHash" },
          { name: "blockHash" },
          { name: "contractAddress" },
        ]
      },
    ]
  });