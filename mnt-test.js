import { ethers } from "ethers";
import { RunConfig } from "./RunConfig.js";

import { sqlHelper } from "./database/sqlHelper.js";
import fs from "fs";

const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);

// const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);

// let numberRange = process.argv.slice(2)[0];
// let startNumber = BigInt(numberRange.split("-")[0]);
// let endNumber = BigInt(numberRange.split("-")[1]);

// for (let i = startNumber; i <= endNumber; i++) {
//     let blockInfo = await provider.getBlock(i);
//     if (blockInfo.transactions.length > 0) {
//         console.log("BlockNumber:" + i + "            TransactionCount:" + blockInfo.transactions.length);
//         for (let j in blockInfo.transactions) {
//             let transactionInfo = await provider.getTransaction(blockInfo.transactions[j]);
//             console.log(transactionInfo);
//         }
//     }
// }

const provider0 = new ethers.JsonRpcProvider('https://rpc.metabasenet.site');
const transactionReceiptInfo = await provider0.getTransactionReceipt("0x94cd41f3d3a1aceb0090d2917a96d512ac3e77973c2d18b8b0397b2e67a08308");
const transactionInfo = await provider0.getTransaction("0x94cd41f3d3a1aceb0090d2917a96d512ac3e77973c2d18b8b0397b2e67a08308");
console.log(transactionInfo.data.length < 4 && transactionReceiptInfo.status == 1);


provider.getBalance("0x670A235Efba2ee081aE09AeeBE53ae359F13F4f6").then(balance => {
    console.log(balance);
})
