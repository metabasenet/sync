import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';
export const SwapPairs = sequelize.define('swap_pairs', {
  token0_address: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  token1_address: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  token0_name: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  token1_name: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  token0_symbol: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  token1_symbol: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  token0_decimals: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  token1_decimals: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  block_number: {
    type: DataTypes.DECIMAL(10, 0),
    allowNull: true
  },
  transaction_hash: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  pair_address: {
    type: DataTypes.STRING(50),
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'swap_pairs',
  timestamps: false,
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [
        { name: "token0_address" },
        { name: "token1_address" },
      ]
    },
  ]
});

