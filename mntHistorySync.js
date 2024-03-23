import { ethers } from "ethers";
import { Block } from './models/block.js';
import { Transaction } from './models/transaction.js';
import { TransactionReceipt } from './models/transaction_receipt.js';
import { Contract } from "./models/contract.js";
import { Sequelize } from 'sequelize';
import { config } from './database/config.js';
import fs from "fs";

const provider = new ethers.JsonRpcProvider("https://test.metabasenet.site/rpc");
let blockNumber = await provider.getBlockNumber();
console.log(blockNumber);

const asyncStep = 50;

const sequelize = new Sequelize(config.database, config.username, config.password, {
    dialect: 'mysql',
    host: config.host,
    timezone: config.timezone,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});

const block = await sequelize.query("SELECT IFNULL(max(number)+1,0) as number FROM `block`");
console.log(block)
let startNumber = block[0][0].number;

console.log("Start number:" + startNumber);
for (let i = Number(startNumber); i <= blockNumber; i = i + asyncStep) {

    console.log("sync numberSyncing blocks:" + i);
    let blockInfoArray = [];
    let transactionInfoArray = [];
    let transactionReceiptInfoArray = [];
    let contartInfoArray = [];
    for (let k = i; k < i + asyncStep; k++) {
        let blockInfo = await provider.getBlock(k);
        const blockInfoModel = {
            number: blockInfo.number,
            hash: blockInfo.hash,
            parentHash: blockInfo.parentHash,
            timestamp: blockInfo.timestamp,
            gasLimit: blockInfo.gasLimit,
            gasUsed: blockInfo.gasUsed,
            miner: blockInfo.miner,
            extraData: blockInfo.extraData,
            baseFeePerGas: blockInfo.baseFeePerGas,
            transactionCount: blockInfo.transactions.length,
            nonce: blockInfo.nonce,
            difficulty: blockInfo.difficulty
        }
        blockInfoArray.push(blockInfoModel)

        for (let j in blockInfo.transactions) {
            let transactionInfo = await provider.getTransaction(blockInfo.transactions[j]);
            const transactionInfoModel = {
                hash: transactionInfo.hash,
                type: transactionInfo.type,
                blockHash: transactionInfo.blockHash,
                blockNumber: transactionInfo.blockNumber,
                transactionIndex: transactionInfo.index,
                from: transactionInfo.from,
                gasPrice: transactionInfo.gasPrice,
                maxPriorityFeePerGas: transactionInfo.maxPriorityFeePerGas,
                maxFeePerGas: transactionInfo.maxFeePerGas,
                gasLimit: transactionInfo.gasLimit,
                to: transactionInfo.to,
                value: transactionInfo.value,
                nonce: transactionInfo.nonce,
                data: transactionInfo.data,
                creates: transactionInfo.create,
                chainId: transactionInfo.chainId
            }
            transactionInfoArray.push(transactionInfoModel);

            let transactionReceiptInfo = await provider.getTransactionReceipt(blockInfo.transactions[j]);
            const transactionReceiptInfoModel = {
                transactionHash: transactionReceiptInfo.hash,
                to: transactionReceiptInfo.to,
                from: transactionReceiptInfo.from,
                contractAddress: transactionReceiptInfo.contractAddress,
                transactionIndex: transactionReceiptInfo.index,
                blockHash: transactionReceiptInfo.blockHash,
                blockNumber: transactionReceiptInfo.blockNumber,
                gasUsed: transactionReceiptInfo.gasUsed,
                cumulativeGasUsed: transactionReceiptInfo.cumulativeGasUsed,
                effectiveGasPrice: transactionReceiptInfo.gasPrice,
                status: transactionReceiptInfo.status,
                type: transactionReceiptInfo.type
            }
            transactionReceiptInfoArray.push(transactionReceiptInfoModel);

            if (transactionReceiptInfo.contractAddress != null) {
                const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
                try {
                    const contract = new ethers.Contract(transactionReceiptInfo.contractAddress, ERC20ABi, provider);
                    const name = await contract.name();
                    const Symbol = await contract.symbol();
                    const totalSupply = await contract.totalSupply();
                    const decimals = await contract.decimals();
                    const contactInfoModel = {
                        contractAddress: transactionReceiptInfo.contractAddress,
                        blockHash: transactionReceiptInfo.blockHash,
                        transactionHash: transactionReceiptInfo.hash,
                        blockNumber: transactionReceiptInfo.blockNumber,
                        creator: transactionReceiptInfo.from,
                        status: transactionReceiptInfo.status,
                        totalSupply: totalSupply,
                        ercName: name,
                        ercSymbol: Symbol,
                        decimals: decimals
                    }
                    contartInfoArray.push(contactInfoModel);
                } catch (e) {
                    console.log("Contract create failed!")
                    console.log(e)
                }
            }
        }
    }
    bulkCreateBlock(blockInfoArray);
    if (transactionInfoArray.length > 0) {
        bulkCreateTransaction(transactionInfoArray);
    }
    if (transactionReceiptInfoArray.length > 0) {
        bulkCreateTransactionReceipt(transactionReceiptInfoArray);
    }
    if (contartInfoArray.length > 0) {
        bulkCreateContract(contartInfoArray);
    }
}

async function bulkCreateBlock(blockInfoArray) {
    await Block.bulkCreate(blockInfoArray).then(() => {
        console.log("Block save successfully!");
    }).catch(error => {
        console.log("Block save failed!\n" + error);
    })
}

async function bulkCreateTransaction(transactionInfoArray) {
    await Transaction.bulkCreate(transactionInfoArray).then(() => {
        console.log("Transaction save successfully!");
    }).catch(error => {
        console.log("Transaction save failed!\n" + error);
    })
}

async function bulkCreateTransactionReceipt(transactionReceiptInfoArray) {
    await TransactionReceipt.bulkCreate(transactionReceiptInfoArray).then(() => {
        console.log("Transaction Receipt save successfully!");
    }).catch(error => {
        console.log("Transaction Receipt save failed!\n" + error);
    })
}

async function bulkCreateContract(contartInfoArray) {
    await Contract.bulkCreate(contartInfoArray).then(() => {
        console.log("Contract save successfully!");
    }).catch(error => {
        console.log("Contract save failed!\n" + error);
    })
}
