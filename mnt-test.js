import { ethers } from "ethers";
import { RunConfig } from "./RunConfig.js";

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

let startNumber = 0;
let endNumber = 37;
let asyncStep = 10;
for (let i = Number(startNumber); i <= endNumber; i = i + asyncStep) {
    console.log("   " + i + "       " + (i + asyncStep));
    for (let k = i; k < i + asyncStep; k++) {
        if (k > endNumber) {
            console.log("不执行:" + k)
            break;
        }
        console.log("处理:" + k)
    }
}