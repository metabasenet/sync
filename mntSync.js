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

    let gasPrice;
    if (blockInfo.transactions.length > 0) {
        gasPrice = provider.getTransaction(blockInfo.transactions[0]).gasPrice
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
    }).then(() => {
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
            methodHash: transactionInfo.data.length > 4 ? transactionInfo.data.slice(0, 10) : null,
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
            type: transactionType
        }).then(() => {
            console.log("Transaction Receipt information saved successfully!");
        }).catch(error => {
            console.log("Transaction Receipt information saved failed!\n" + error);
        })

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
                }).then(() => {
                    console.log("Transaction Receipt information saved successfully!");
                }).catch(error => {
                    console.log("Transaction Receipt information saved failed!\n" + error);
                })
            } catch (ex) {

            }
        }

        if (transactionReceiptInfo.logs.length > 0) {
            for (let m = 0; m < transactionReceiptInfo.logs.length; m++) {
                const TransactionErc20Model = {
                    transactionHash: transactionReceiptInfo.logs[m].transactionHash,
                    contractAddress: transactionReceiptInfo.logs[m].address,
                    blockHash: transactionReceiptInfo.logs[m].blockHash.slice(0, 10),
                    blockNumber: transactionReceiptInfo.logs[m].blockNumber,
                    methodHash: transactionReceiptInfo.logs[m].topics[0],
                    from: transactionReceiptInfo.logs[m].topics[1] != null ? transactionReceiptInfo.logs[m].topics[1].replace("0x000000000000000000000000", "0x") : null,
                    to: transactionReceiptInfo.logs[m].topics[2] != null ? transactionReceiptInfo.logs[m].topics[2].replace("0x000000000000000000000000", "0x") : null,
                    value: transactionReceiptInfo.logs[m].data != null ? parseInt(transactionReceiptInfo.logs[m].data, 16) : null,
                    index: transactionReceiptInfo.logs[m].index
                }
                TransactionErc20.create(TransactionErc20Model);

                //update ERC20 balance
                const contract = new ethers.Contract(TransactionErc20Model.contractAddress, ERC20ABi, provider);
                let addressFrom = transactionReceiptInfo.logs[m].topics[1].replace("0x000000000000000000000000", "0x");
                let balanceFrom = await contract.balanceOf(addressFrom);
                let addressTo = transactionReceiptInfo.logs[m].topics[2].replace("0x000000000000000000000000", "0x");
                let balanceTo = await contract.balanceOf(addressTo);
                updateErc20Balance(addressFrom, transactionReceiptInfo.logs[m].address, balanceFrom);
                updateErc20Balance(addressTo, transactionReceiptInfo.logs[m].address, balanceTo);
            }
        }

        // if (transactionReceiptInfo.to != null) {
        //     provider.getCode(transactionReceiptInfo.to).then(async code => {
        //         //determine contract address
        //         if (code.length > 4) {
        //             const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));
        //             // const eventAbi = [
        //             //     "event Transfer(address indexed from, address indexed to, uint256 value)"
        //             // ];
        //             const contract = new ethers.Contract(transactionReceiptInfo.to, ERC20ABi, provider);
        //             try {
        //                 console.log(blockNumber);
        //                 //sync contrat transaction info 
        //                 const transferEvents = await contract.queryFilter('Transfer', blockNumber, blockNumber);
        //                 if (transferEvents !== undefined && transferEvents.length > 0) {
        //                     for (let i in transferEvents) {
        //                         TransactionErc20.create({
        //                             transactionHash: transferEvents[i].transactionHash,
        //                             contractAddress: transferEvents[i].address,
        //                             blockHash: transferEvents[i].blockHash,
        //                             blockNumber: transferEvents[i].blockNumber,
        //                             from: transferEvents[i].topics[1],
        //                             to: transferEvents[i].topics[2],
        //                             value: parseInt(transferEvents[i].data, 16)
        //                         }).then(() => {
        //                             console.log("erc20 information save successfully!");
        //                         }).catch(error => {
        //                             console.log("erc20 information save failed!\n" + error);
        //                         })

        //                         //update ERC20 balance
        //                         let addressFrom = transferEvents[i].topics[1].replace("0x000000000000000000000000", "0x");
        //                         let balanceFrom = await contract.balanceOf(addressFrom);
        //                         let addressTo = transferEvents[i].topics[1].replace("0x000000000000000000000000", "0x");
        //                         let balanceTo = await contract.balanceOf(addressTo);
        //                         updateErc20Balance(addressFrom, transferEvents[i].address, balanceFrom);
        //                         updateErc20Balance(addressTo, transferEvents[i].address, balanceTo);

        //                     }
        //                 }
        //             } catch (e) {
        //                 console.log(e.message)
        //             }
        //         }
        //     });
        // }

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

function updateErc20Balance(address, contractAddress, balance) {
    let sql = "REPLACE  INTO erc20_balance(address,contractAddress, balance, updateTime) VALUES (:address,:contractAddress, :balance, NOW())";
    sequelize.query(sql, {
        replacements: { address: address, contractAddress: contractAddress, balance: balance },
        type: Sequelize.QueryTypes.INSERT
    });
}