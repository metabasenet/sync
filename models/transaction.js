import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';
export const Transaction = sequelize.define('transaction', {
  hash: {
    type: DataTypes.STRING(100),
    allowNull: false,
    primaryKey: true
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  blockHash: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  blockNumber: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  transactionIndex: {
    type: DataTypes.TINYINT,
    allowNull: true
  },
  confirmations: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  from: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  gasPrice: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  maxPriorityFeePerGas: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  maxFeePerGas: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  gasLimit: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  to: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  value: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  nonce: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  data: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  methodHash: {
    type: DataTypes.STRING(15),
    allowNull: true
  },
  r: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  s: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  v: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  creates: {
    type: DataTypes.STRING(80),
    allowNull: true
  },
  chainId: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'transaction',
  timestamps: false,
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [
        { name: "hash" },
      ]
    },
  ]
});

