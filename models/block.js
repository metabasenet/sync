
import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const Block = sequelize.define('block', {
  number: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: false,
    primaryKey: true
  },
  hash: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  parentHash: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  timestamp: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  transactionCount: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  nonce: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  difficulty: {
    type: DataTypes.BIGINT,
    allowNull: true
  },
  gasLimit: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  gasUsed: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  miner: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  extraData: {
    type: DataTypes.STRING(1000),
    allowNull: true
  },
  baseFeePerGas: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'block',
  timestamps: false,
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [
        { name: "number" },
      ]
    },
  ]
});