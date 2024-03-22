import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';

export const platformBalance = sequelize.define('platform_balance', {
  address: {
    type: DataTypes.STRING(50),
    allowNull: false,
    primaryKey: true
  },
  balance: {
    type: DataTypes.DECIMAL(65, 0),
    allowNull: true
  },
  updateTime: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  sequelize,
  tableName: 'platform_balance',
  timestamps: false,
  indexes: [
    {
      name: "PRIMARY",
      unique: true,
      using: "BTREE",
      fields: [
        { name: "address" },
      ]
    },
  ]
});