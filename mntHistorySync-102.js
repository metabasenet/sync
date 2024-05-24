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
import { PlatformInternalTransaction } from "./models/platform_internal_transaction.js"


const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl102);
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
    let TransactionErc20ModelArray = [];
    let PlatformInternalTransactionModelArray = [];
    for (let k = i; k < i + asyncStep; k++) {
        if (k > endNumber) {
            break;
        }

        let blockInfo = await provider.getBlock(k);

        let gasPrice;
        if (blockInfo.transactions != null && blockInfo.transactions.length > 0) {
            gasPrice = provider.getTransaction(blockInfo.transactions[0]).gasPrice
        }
        const blockInfoModel = {
            number: blockInfo.number,
            hash: blockInfo.hash,
            parentHash: blockInfo.parentHash,
            timestamp: blockInfo.timestamp,
            gasLimit: blockInfo.gasLimit,
            gasUsed: blockInfo.gasUsed,
            gasPrice: gasPrice,
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

            //error transaction
            if (transactionInfo == null) {
                console.log(blockInfo.transactions[j]);
                const transactionInfoModel = {
                    hash: blockInfo.transactions[j],
                    blockNumber: blockInfo.number,
                    blockHash: blockInfo.blockHash,
                }
                transactionInfoArray.push(transactionInfoModel);
                continue;
            }

            let transactionType;
            if (transactionInfo.data.length < 4) {
                transactionType = 0;

                //sync platform internal transaction
                const PlatformInternalTransactionModel = {
                    transactionHash: transactionInfo.hash,
                    contractAddress: ethers.ZeroAddress,
                    blockHash: blockInfo.hash,
                    blockNumber: blockInfo.number,
                    methodHash: 'transfer',
                    from: transactionInfo.from,
                    to: transactionInfo.to,
                    value: ethers.formatEther(transactionInfo.value),
                    index: -1,
                }
                PlatformInternalTransactionModelArray.push(PlatformInternalTransactionModel);
            } else if (transactionInfo.data.length > 4) {
                if (transactionInfo.to == undefined) {
                    transactionType = 1;
                } else {
                    transactionType = 2;
                }
            }

            const transactionInfoModel = {
                hash: transactionInfo.hash,
                type: transactionType,
                blockHash: transactionInfo.blockHash,
                blockNumber: transactionInfo.blockNumber,
                transactionIndex: transactionInfo.transactionIndex,
                from: transactionInfo.from,
                gasPrice: transactionInfo.gasPrice,
                maxPriorityFeePerGas: transactionInfo.maxPriorityFeePerGas,
                maxFeePerGas: transactionInfo.maxFeePerGas,
                gasLimit: transactionInfo.gasLimit,
                to: transactionInfo.to,
                value: transactionInfo.value,
                nonce: transactionInfo.nonce,
                data: transactionInfo.data,
                methodHash: transactionInfo.data.length > 0 ? transactionInfo.data.slice(0, 10) : null,
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
                transactionIndex: transactionReceiptInfo.transactionIndex,
                blockHash: transactionReceiptInfo.blockHash,
                blockNumber: transactionReceiptInfo.blockNumber,
                gasUsed: transactionReceiptInfo.gasUsed,
                cumulativeGasUsed: transactionReceiptInfo.cumulativeGasUsed,
                effectiveGasPrice: transactionReceiptInfo.gasPrice,
                status: transactionReceiptInfo.status,
                type: transactionType
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

            if (transactionReceiptInfo.logs.length > 0) {
                for (let m = 0; m < transactionReceiptInfo.logs.length; m++) {
                    const TransactionErc20Model = {
                        transactionHash: transactionReceiptInfo.logs[m].transactionHash,
                        contractAddress: transactionReceiptInfo.logs[m].address,
                        blockHash: transactionReceiptInfo.logs[m].blockHash,
                        blockNumber: transactionReceiptInfo.logs[m].blockNumber,
                        methodHash: transactionReceiptInfo.logs[m].topics[0],
                        from: transactionReceiptInfo.logs[m].topics[1] != null ? transactionReceiptInfo.logs[m].topics[1] : null,
                        to: transactionReceiptInfo.logs[m].topics[2] != null ? transactionReceiptInfo.logs[m].topics[2] : null,
                        value: transactionReceiptInfo.logs[m].data != null ? transactionReceiptInfo.logs[m].data : null,
                        index: transactionReceiptInfo.logs[m].index
                    }

                    if (TransactionErc20Model.contractAddress != ethers.ZeroAddress) {
                        TransactionErc20ModelArray.push(TransactionErc20Model);
                    } else {
                        PlatformInternalTransactionModelArray.push(TransactionErc20Model)
                    }
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
    if (TransactionErc20ModelArray.length > 0) {
        bulkCreateTransactionErc20(TransactionErc20ModelArray)
    }
    if (PlatformInternalTransactionModelArray.length > 0) {
        bulkCreatePlatformInternalTransaction(PlatformInternalTransactionModelArray);
    }
}


//update platform balance 
sqlHelper.init();
const selectSql = "SELECT DISTINCT address FROM ( SELECT DISTINCT `from` AS address FROM `transaction_receipt` UNION SELECT DISTINCT `to` AS address FROM `transaction_receipt` UNION SELECT DISTINCT `contractAddress` AS address FROM `transaction_receipt` WHERE contractAddress is not NULL ) A";
sqlHelper.readDatabase(selectSql, getAddressCallback);

function getAddressCallback(err, result) {
    if (err) {
        console.log(err.message);
    } else {
        for (let i in result) {
            if (result[i].address != null && result[i].address != ethers.ZeroAddress) {
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
            if (result[i].contractAddress != ethers.AddressZero) {
                try {
                    const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
                    const contract = new ethers.Contract(result[i].contractAddress, ERC20ABi, provider);
                    //update ERC20 balance
                    let address = result[i].address.replace("0x000000000000000000000000", "0x");
                    let balance = await contract.balanceOf(address);
                    if (balance !== null && balance > 0) {
                        let insertSql = `REPLACE  INTO erc20_balance(address,contractAddress, balance, updateTime) VALUES ('${address}','${result[i].contractAddress}', '${balance}', NOW())`;
                        sqlHelper.writeDatabase(insertSql, new Date());
                    }
                } catch (ex) {
                    console.log(ex.message)
                }
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

async function bulkCreatePlatformInternalTransaction(platformInternalTransactionModelArray) {
    await PlatformInternalTransaction.bulkCreate(platformInternalTransactionModelArray).then(() => {
        console.log("platform internal transaction save successfully!");
    }).catch(error => {
        console.log("platform internal transaction save failed!\n" + error);
    })
}
