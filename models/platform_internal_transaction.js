
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const PlatformInternalTransaction = sequelize.define('platform_internal_transaction', {
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
  index: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  methodHash: {
    type: DataTypes.STRING(100),
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
    type: DataTypes.STRING(500),
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'platform_internal_transaction',
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
        { name: "index" },
      ]
    },
  ]
});