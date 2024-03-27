import { ethers } from "ethers";
import { Block } from './models/block.js';
import { Transaction } from './models/transaction.js';
import { TransactionReceipt } from './models/transaction_receipt.js';
import { Contract } from "./models/contract.js";
import fs from "fs";
import { TransactionErc20 } from "./models/transaction_erc20.js"
import { Sequelize } from 'sequelize';
import { config } from "./database/config.js";
import { RunConfig } from "./RunConfig.js";

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

const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);
provider.on("block", async (blockNumber) => {
    console.log(blockNumber)
    let blockInfo = await provider.getBlock(blockNumber);
    //sync block
    await Block.create({
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
    }).then(() => {
        console.log("Block save successfully!");
    }).catch(error => {
        console.log("Block save failed!\n" + error);
    })

    //sync transactions
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
        //sync TransactionReceipt
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

        //sync create contract info
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
        //sync contrat transaction info 
        if (transactionReceiptInfo.to != null) {
            provider.getCode(transactionReceiptInfo.to).then(async code => {
                //determine contract address
                if (code.length > 4) {
                    const eventAbi = [
                        "event Transfer(address indexed from, address indexed to, uint256 value)"
                    ];
                    const contract = new ethers.Contract(transactionReceiptInfo.to, eventAbi, provider);
                    try {
                        console.log(blockNumber);
                        const transferEvents = await contract.queryFilter('Transfer', blockNumber, blockNumber);
                        if (transferEvents !== undefined && transferEvents.length > 0) {
       
                            for (let i in transferEvents) {
                                TransactionErc20.create({
                                    transactionHash: transferEvents[i].transactionHash,
                                    contractAddress: transferEvents[i].address,
                                    blockHash: transferEvents[i].blockHash,
                                    blockNumber: transferEvents[i].blockNumber,
                                    from: transferEvents[i].topics[1],
                                    to: transferEvents[i].topics[2],
                                    value: parseInt(transferEvents[i].data, 16)
                                }).then(() => {
                                    console.log("erc20 information save successfully!");
                                }).catch(error => {
                                    console.log("erc20 information save failed!\n" + error);
                                })

                                console.log(transferEvents[i].topics)
                            }
                        }
                    } catch (e) {
                        console.log(e.message)
                    }

                }
            });
        }

        //update balance
        updateBalance(transactionReceiptInfo.from);
        updateBalance(transactionReceiptInfo.to);

    }
})



function updateBalance(address) {
    if (address != null) {
        provider.getCode(address).then(code => {
            if (code.length <= 4) {
                provider.getBalance(address).then(balance => {
                    let sql = "REPLACE  INTO platform_balance(address, balance, updateTime) VALUES (:address, :balance, NOW())";
                    sequelize.query(sql, {
                        replacements: { address: address, balance: balance },
                        type: Sequelize.QueryTypes.INSERT
                    });
                })
            }
        })
    }
}