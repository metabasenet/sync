import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js';
export const Contract =  sequelize.define('contract', {
    contractAddress: {
      type: DataTypes.STRING(50),
      allowNull: false,
      primaryKey: true
    },
    blockHash: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    transactionHash: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    blockNumber: {
      type: DataTypes.DECIMAL(65,0),
      allowNull: true
    },
    abi: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    creator: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    createTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    totalSupply: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    ercName: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    ercSymbol: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    decimals: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'contract',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "contractAddress" },
        ]
      },
    ]
  });
