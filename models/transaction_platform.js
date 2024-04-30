import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';
export const TransactionPlatform = sequelize.define('transaction_platform', {
  transactionHash: {
    type: DataTypes.STRING(100),
    allowNull: false,
    primaryKey: true
  },
  index: {
    type: DataTypes.INTEGER,
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
    type: DataTypes.DECIMAL(65, 18),
    allowNull: true
  },
  utc: {
    type: DataTypes.BIGINT,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'transaction_platform',
  timestamps: false,
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [
        { name: "tansactionHash" },
        { name: "index" },
      ]
    },
  ]
});

