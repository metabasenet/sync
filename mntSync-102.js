import { ethers } from "ethers";
import { Block } from './models/block.js';
import { Transaction } from './models/transaction.js';
import { TransactionReceipt } from './models/transaction_receipt.js';
import { Contract } from "./models/contract.js";
import fs from "fs";
import { TransactionErc20 } from "./models/transaction_erc20.js"
import { PlatformInternalTransaction } from "./models/platform_internal_transaction.js"
import { Sequelize } from 'sequelize';
import { config } from "./database/config.js";
import { RunConfig } from "./RunConfig.js";
import BigNumber from "bignumber.js";


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

const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl102);
provider.on("block", async (blockNumber) => {
    const sqlTransaction = await sequelize.transaction();
    try {
        console.log(blockNumber)
        let blockInfo = await provider.getBlock(blockNumber);
        //sync block

        let gasPrice;
        if (blockInfo.transactions != null && blockInfo.transactions.length > 0) {
            const transaction = await provider.getTransaction(blockInfo.transactions[0]);
            gasPrice = transaction.gasPrice;
        }
        await Block.create({
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
        }, { transaction: sqlTransaction }).then(() => {
            console.log("Block save successfully!");
        }).catch(error => {
            console.log("Block save failed!\n" + error);
        })

        //sync transactions
        for (let i in blockInfo.transactions) {
            let transactionInfo = await provider.getTransaction(blockInfo.transactions[i])

            let transactionType;
            if (transactionInfo.data.length < 4) {
                transactionType = 0;
            } else if (transactionInfo.data.length > 4) {
                if (transactionInfo.to == undefined) {
                    transactionType = 1;
                } else {
                    transactionType = 2;
                }
            }

            await Transaction.create({
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
            }, { transaction: sqlTransaction }).then(() => {
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
                type: transactionType
            }, { transaction: sqlTransaction }).then(() => {
                console.log("Transaction Receipt information saved successfully!");
            }).catch(error => {
                console.log("Transaction Receipt information saved failed!\n" + error);
            })

            if (transactionInfo.data.length < 4 && transactionReceiptInfo.status == 1) {
                //sync platform internal transaction
                const PlatformInternalTransactionModel = {
                    transactionHash: transactionInfo.hash,
                    contractAddress: ethers.ZeroAddress,
                    blockHash: blockInfo.hash,
                    blockNumber: blockInfo.number,
                    methodHash: 'transfer',
                    from: transactionInfo.from,
                    to: transactionInfo.to,
                    value: transactionInfo.value,
                    index: -1,
                }
                await PlatformInternalTransaction.create(PlatformInternalTransactionModel, { transaction: sqlTransaction });
            }

            //sync create contract info
            if (transactionReceiptInfo.contractAddress != null) {
                const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
                const contract = new ethers.Contract(transactionReceiptInfo.contractAddress, ERC20ABi, provider);
                try {
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
                    }, { transaction: sqlTransaction }).then(() => {
                        console.log("Transaction Receipt information saved successfully!");
                    }).catch(error => {
                        console.log("Transaction Receipt information saved failed!\n" + error);
                    })
                } catch (ex) {

                }
            }

            //erc20 log
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
                        await TransactionErc20.create(TransactionErc20Model, { transaction: sqlTransaction });
                    } else {
                        await PlatformInternalTransaction.create(TransactionErc20Model, { transaction: sqlTransaction })
                    }

                    //update ERC20 balance
                    try {
                        if (TransactionErc20Model.contractAddress != ethers.ZeroAddress) {
                            const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
                            const contract = new ethers.Contract(TransactionErc20Model.contractAddress, ERC20ABi, provider);

                            if (transactionReceiptInfo.logs[m].topics[1] != null) {
                                let addressFrom = transactionReceiptInfo.logs[m].topics[1].replace("0x000000000000000000000000", "0x");
                                let balanceFrom = await contract.balanceOf(addressFrom);
                                updateErc20Balance(addressFrom, transactionReceiptInfo.logs[m].address, balanceFrom);
                            }

                            if (transactionReceiptInfo.logs[m].topics[2] != null) {
                                let addressTo = transactionReceiptInfo.logs[m].topics[2].replace("0x000000000000000000000000", "0x");
                                let balanceTo = await contract.balanceOf(addressTo);
                                updateErc20Balance(addressTo, transactionReceiptInfo.logs[m].address, balanceTo);
                            }
                        }
                    } catch (e) {
                        console.log(e)
                    }
                }
            }

            //update balance
            updateBalance(transactionReceiptInfo.from);
            updateBalance(transactionReceiptInfo.to);
            updateBalance(transactionReceiptInfo.contractAddress);
        }
        await sqlTransaction.commit();
        // await updateMNtprice(provider);
    } catch (e) {
        console.log(e)
        await sqlTransaction.rollback();
        console.log("error block:" + blockNumber);
        let sql = "REPLACE  INTO except_block(blockNumber, sync_date) VALUES (:blockNumber, NOW())";
        sequelize.query(sql, {
            replacements: { blockNumber: blockNumber },
            type: Sequelize.QueryTypes.INSERT
        });
    }
})

function updateBalance(address) {
    if (address != null && address != ethers.ZeroAddress) {
        provider.getBalance(address).then(balance => {
            let sql = "REPLACE  INTO platform_balance(address, balance, updateTime) VALUES (:address, :balance, NOW())";
            sequelize.query(sql, {
                replacements: { address: address, balance: balance },
                type: Sequelize.QueryTypes.INSERT
            });
        })
    }
}

function updateErc20Balance(address, contractAddress, balance) {
    if (balance > 0) {
        let sql = "REPLACE  INTO erc20_balance(address,contractAddress, balance, updateTime) VALUES (:address,:contractAddress, :balance, NOW())";
        sequelize.query(sql, {
            replacements: { address: address, contractAddress: contractAddress, balance: parseInt(balance, 16) },
            type: Sequelize.QueryTypes.INSERT
        });
    }
}


async function updateMNtprice(provider) {
    const abi = [{
        "inputs": [],
        "name": "getReserves",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "pair_usdt",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "pair_mnt",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }]
    const Buy = new ethers.Contract(RunConfig.buy_addr, abi, provider);
    let ret = await Buy.getReserves();
    console.log(ret);
    const value = BigNumber(ret.pair_usdt).div(ret.pair_mnt).toFixed(4);
    let sql = "REPLACE  INTO mnt_price(id,price, date) VALUES ('1',:price, NOW())";
    sequelize.query(sql, {
        replacements: { price: value },
        type: Sequelize.QueryTypes.INSERT
    });
}