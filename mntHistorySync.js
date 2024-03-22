import { ethers } from "ethers";
import { Block } from './models/block.js';
import { Transaction } from './models/transaction.js';
import { TransactionReceipt } from './models/transaction_receipt.js';
import { Contract } from "./models/contract.js";
import { Sequelize } from 'sequelize';
import { config } from './database/config.js';

const provider = new ethers.JsonRpcProvider("https://test.metabasenet.site/rpc");
let blockNumber = await provider.getBlockNumber();
console.log(blockNumber);

const sequelize = new Sequelize(config.database, config.username, config.password, {
    dialect: 'mysql',
    host: config.host,
    timezone: '+08:00',
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
for (let i = Number(startNumber); i <= blockNumber; i++) {
    console.log(i);
    let blockInfo = await provider.getBlock(i);
    console.log(blockInfo);
    await Block.create({
        number: blockInfo.number,
        hash: blockInfo.hash,
        parentHash: blockInfo.parentHash,
        timestamp: blockInfo.timestamp,
        gasLimit: blockInfo.gasLimit,
        gasUsed: blockInfo.gasUsed,
        miner: blockInfo.miner,
        baseFeePerGas: blockInfo.baseFeePerGas,
        transactionCount: blockInfo.transactions.length
    }).then(() => {
        console.log("Block save successfully!");
    }).catch(error => {
        console.log("Block save failed!\n" + error);
    })
    console.log(blockInfo.transactions)
    for (let i in blockInfo.transactions) {
        let transactionInfo = await provider.getTransaction(blockInfo.transactions[i])
        await Transaction.create({
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
        }).then(() => {
            console.log("Transaction information save successfully!");
        }).catch(error => {
            console.log("Transaction information save failed!\n" + error);
        })
        let transactionReceiptInfo = await provider.getTransactionReceipt(blockInfo.transactions[i]);
        await TransactionReceipt.create({
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
            type: transactionReceiptInfo.type,
        }).then(() => {
            console.log("Transaction Receipt information saved successfully!");
        }).catch(error => {
            console.log("Transaction Receipt information saved failed!\n" + error);
        })

        if (transactionReceiptInfo.contractAddress != null) {

            const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
            const contract = new ethers.Contract(transactionReceiptInfo.contractAddress, ERC20ABi, provider);
            const name = await contract.name();
            const Symbol = await contract.symbol();
            const totalSupply = await contract.totalSupply();
            const decimals = await contract.decimals();

            await Contract.create({
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
            }).then(() => {
                console.log("Transaction Receipt information saved successfully!");
            }).catch(error => {
                console.log("Transaction Receipt information saved failed!\n" + error);
            })
        }
    }
}