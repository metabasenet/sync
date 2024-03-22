import { DataTypes } from 'sequelize';
import { sequelize } from '../database/connection.js'; 

export const TransactionReceipt = sequelize.define('transaction_receipt', {
    transactionHash: {
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
    contractAddress: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    transactionIndex: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    gasUsed: {
      type: DataTypes.DECIMAL(65,0),
      allowNull: true
    },
    logsBloom: {
      type: DataTypes.STRING(1000),
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
    confirmations: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    cumulativeGasUsed: {
      type: DataTypes.DECIMAL(65,0),
      allowNull: true
    },
    effectiveGasPrice: {
      type: DataTypes.DECIMAL(65,0),
      allowNull: true
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    type: {
      type: DataTypes.TINYINT,
      allowNull: true
    },
    byzantium: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'transaction_receipt',
    timestamps: false,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "transactionHash" },
        ]
      },
    ]
  });
