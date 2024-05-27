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

// const provider0 = new ethers.JsonRpcProvider('https://rpc.metabasenet.site');
// const transaction = await provider0.getTransactionReceipt("0x494c0c262894635a8af4a98308cac718eb84939742a3814b39d2cf1469cac104");
// console.log(transaction);


console.log(ethers.formatUnits('23967900000000000000000', 9))  