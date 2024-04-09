import { ethers } from "ethers";
import { Block } from './models/block.js';
import { Transaction } from './models/transaction.js';
import { TransactionReceipt } from './models/transaction_receipt.js';
import { Contract } from "./models/contract.js";
import { Sequelize } from 'sequelize';
import { config } from './database/config.js';
import fs from "fs";
import { TransactionErc20 } from "./models/transaction_erc20.js";
import { sqlHelper } from "./database/sqlHelper.js";
import { RunConfig } from "./RunConfig.js";

const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);
let blockNumber = await provider.getBlockNumber();
let endNumber = RunConfig.endNumber > 0 ? RunConfig.endNumber : blockNumber;
const asyncStep = RunConfig.asyncStep;

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

// const block = await sequelize.query("SELECT IFNULL(max(number)+1,0) as number FROM `block`");
// console.log(block)
// let startNumber = block[0][0].number;
let startNumber = RunConfig.startNumber;

console.log("Start number:" + startNumber);
for (let i = Number(startNumber); i <= endNumber; i = i + asyncStep) {
    console.log("sync numberSyncing blocks:" + i);
    let blockInfoArray = [];
    let transactionInfoArray = [];
    let transactionReceiptInfoArray = [];
    let contartInfoArray = [];
    for (let k = i; k < i + asyncStep; k++) {
        if (k > endNumber) {
            break;
        }

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

            console.log(blockInfo.transactions[j])
            let transactionInfo = await provider.getTransaction(blockInfo.transactions[j]);
            // if(transactionInfo==null){
            //     break;
            // }
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


//sync contract transaction history info
const contractAddressList = await Contract.findAll({
    attributes: ['contractAddress']
})
for (let i in contractAddressList) {
    console.log(contractAddressList[i].contractAddress)
    const eventAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    const contract = new ethers.Contract(contractAddressList[i].contractAddress, eventAbi, provider);
    // let blockNumber = await provider.getBlockNumber();
    try {
        const transferEvents = await contract.queryFilter('Transfer', 0, endNumber);
        if (transferEvents !== undefined && transferEvents.length > 0) {
            let TransactionErc20ModelArray = [];
            for (let i = 0; i <= transferEvents.length; i = i + asyncStep) {
                for (let k = i; k < i + asyncStep; k++) {
                    if (k >= transferEvents.length) {
                        break;
                    }
                    const TransactionErc20Model = {
                        transactionHash: transferEvents[k].transactionHash,
                        contractAddress: transferEvents[k].address,
                        blockHash: transferEvents[k].blockHash,
                        blockNumber: transferEvents[k].blockNumber,
                        from: transferEvents[k].topics[1],
                        to: transferEvents[k].topics[2],
                        value: parseInt(transferEvents[k].data, 16)
                    }
                    TransactionErc20ModelArray.push(TransactionErc20Model);
                }
                bulkCreateTransactionErc20(TransactionErc20ModelArray);
            }
        }
    } catch (e) {
        console.log(e.message)
    }
}

//update platform balance 
sqlHelper.init();
const selectSql = "SELECT  DISTINCT address  from (SELECT DISTINCT `from` AS address FROM `transaction` UNION SELECT DISTINCT `to` AS address FROM `transaction`) A";
sqlHelper.readDatabase(selectSql, getAddressCallback);

function getAddressCallback(err, result) {
    if (err) {
        console.log(err.message);
    } else {
        for (let i in result) {
            if (result[i].address != null) {
                provider.getBalance(result[i].address).then(balance => {
                    const address = result[i].address;
                    let insertSql = `REPLACE  INTO platform_balance(address, balance, updateTime) VALUES ('${address}', ${balance}, ?)`;
                    sqlHelper.writeDatabase(insertSql, new Date());
                })
            }
        }
    }
}

//update erc20 balance 
sqlHelper.init();
const selectErc20AddressSql = "SELECT  DISTINCT contractAddress,address  from (SELECT DISTINCT contractAddress,`from` AS address FROM `transaction_erc20` UNION SELECT DISTINCT contractAddress,`to` AS address FROM `transaction_erc20`) A";
sqlHelper.readDatabase(selectErc20AddressSql, getErc20AddressCallback);
async function getErc20AddressCallback(err, result) {
    if (err) {
        console.log(err.message);
    } else {
        for (let i in result) {
            try {
                const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
                const contract = new ethers.Contract(result[i].contractAddress, ERC20ABi, provider);
                //update ERC20 balance
                let address = result[i].address.replace("0x000000000000000000000000", "0x");
                let balance = await contract.balanceOf(address);
                console.log(balance)
                if (balance !== null) {
                    let insertSql = `REPLACE  INTO erc20_balance(address,contractAddress, balance, updateTime) VALUES ('${address}','${result[i].contractAddress}', '${balance}', NOW())`;
                    sqlHelper.writeDatabase(insertSql, new Date());
                }
            } catch (ex) {
                console.log(ex.message)
            }
        }
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

async function bulkCreateTransactionErc20(TransactionErc20ModelArray) {
    await TransactionErc20.bulkCreate(TransactionErc20ModelArray).then(() => {
        console.log("ERC20 transaction save successfully!");
    }).catch(error => {
        console.log("ERC20 transaction save failed!\n" + error);
    })
}