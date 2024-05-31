// import { ethers } from "ethers";
// import fs from "fs";
// import { RunConfig } from "./RunConfig.js";
// import { config } from "./database/config.js";
// import { Sequelize } from 'sequelize';
// import { SwapPairs } from "./models/swap_pairs.js"
// // swap 0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822
// // PairCreated 0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9

// const sequelize = new Sequelize(config.database, config.username, config.password, {
//     dialect: 'mysql',
//     host: config.host,
//     timezone: config.timezone,
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000,
//     },
// });

// let factoryAddr = '0x6064216D6817a1620002FBa69d485949A009B59d';
// let router02Addr = '0xdfD106145cC3491E727244deF09CecC46F31BE31';

// const uniswapV2FactoryAbi = JSON.parse(fs.readFileSync("./abi/UniswapV2/UniswapV2Factory.json", "utf8"));
// const uniswapV2PairAbi = JSON.parse(fs.readFileSync("./abi/UniswapV2/UniswapV2Pair.json", "utf8"));
// const ERC20ABi = JSON.parse(fs.readFileSync("./abi/erc20.json", "utf8"));

// const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);
// const factoryContract = new ethers.Contract(factoryAddr, uniswapV2FactoryAbi, provider);
// const pairCreatedEvents = await factoryContract.queryFilter('PairCreated', RunConfig.swapStartNumber, RunConfig.swapEndNumber)
// for (let i = 0; i < pairCreatedEvents.length; i++) {
//     const token0Address = pairCreatedEvents[i].topics[1].replace("0x000000000000000000000000", "0x");
//     const token1Address = pairCreatedEvents[i].topics[2].replace("0x000000000000000000000000", "0x");
//     const token0Contract = new ethers.Contract(token0Address, ERC20ABi, provider);
//     const token1Contract = new ethers.Contract(token1Address, ERC20ABi, provider);
//     const pairAddress = pairCreatedEvents[i].data.slice(0, 66).replace("0x000000000000000000000000", "0x");

//     let createPairSql = "INSERT IGNORE INTO `swap_pairs`(`token0_address`, `token1_address`, `token0_name`, `token1_name`, `token0_symbol`, `token1_symbol`, `token0_decimals`, `token1_decimals`, `block_number`, `transaction_hash`, `pair_address`) VALUES (:token0_address, :token1_address, :token0_name, :token1_name, :token0_symbol, :token1_symbol, :token0_decimals, :token1_decimals, :block_number, :transaction_hash, :pair_address)";
//     sequelize.query(createPairSql, {
//         replacements: {
//             token0_address: token0Address,
//             token1_address: token1Address,
//             token0_name: await token0Contract.name(),
//             token1_name: await token1Contract.name(),
//             token0_symbol: await token0Contract.symbol(),
//             token1_symbol: await token1Contract.symbol(),
//             token0_decimals: await token0Contract.decimals(),
//             token1_decimals: await token1Contract.decimals(),
//             block_number: pairCreatedEvents[i].blockNumber,
//             transaction_hash: pairCreatedEvents[i].transactionHash,
//             pair_address: pairAddress
//         },
//         type: Sequelize.QueryTypes.INSERT
//     });
// }


// const swapPairsList = await SwapPairs.findAll();
// for (let i = 0; i < swapPairsList.length; i++) {
//     console.log("synchronize history swap data")
//     const pairAddress = swapPairsList[i].pair_address;
//     const pairContract = new ethers.Contract(pairAddress, uniswapV2PairAbi, provider);
//     const token0Decimals = swapPairsList[i].token0_decimals;
//     const token1Decimals = swapPairsList[i].token1_decimals;

//     const swapEvents = await pairContract.queryFilter('Swap', RunConfig.swapStartNumber, RunConfig.swapEndNumber)
//     for (let j = 0; j < swapEvents.length; j++) {
//         const blockInfo = await provider.getBlock(swapEvents[j].blockNumber);
//         const data = swapEvents[j].data;
//         const paramLength = data.replace("0x", "").length / 4;
//         const amount0In = BigInt("0x" + data.slice(2, paramLength + 2));
//         const amount1In = BigInt("0x" + data.slice(paramLength + 3, paramLength * 2 + 2));
//         const amount0Out = BigInt("0x" + data.slice(paramLength * 2 + 3, paramLength * 3 + 2));
//         const amount1Out = BigInt("0x" + data.slice(paramLength * 3 + 3, paramLength * 4 + 2));
//         const amount0 = amount0In | amount0Out;
//         const amount1 = amount1In | amount1Out;

//         let swapTxSql = "INSERT IGNORE INTO `swap_tx`(`pair_address`, `block_number`, `transaction_hash`, `amount0_in`, `amount1_out`, `amount1_in`, `amount0_out`, `rate01`, `rate10`, `sender`, `receiver`, `token0_symbol`, `token1_symbol`, `index`, `time`) VALUES (:pair_address, :block_number, :transaction_hash, :amount0_in, :amount1_out, :amount1_in, :amount0_out, :rate01, :rate10, :sender, :receiver, :token0_symbol, :token1_symbol, :index, :time)";
//         sequelize.query(swapTxSql, {
//             replacements: {
//                 pair_address: pairAddress,
//                 block_number: transactionReceiptInfo.logs[k].blockNumber,
//                 transaction_hash: transactionReceiptInfo.logs[k].transactionHash,
//                 amount0_in: amount0In,
//                 amount1_out: amount1Out,
//                 amount1_in: amount1In,
//                 amount0_out: amount0Out,
//                 rate01: ethers.formatUnits(amount0, token0Decimals) / ethers.formatUnits(amount1, token1Decimals),
//                 rate10: ethers.formatUnits(amount1, token0Decimals) / ethers.formatUnits(amount0, token1Decimals),
//                 sender: transactionReceiptInfo.logs[k].topics[1].replace("0x000000000000000000000000", "0x"),
//                 receiver: transactionReceiptInfo.logs[k].topics[2].replace("0x000000000000000000000000", "0x"),
//                 token0_symbol: swapPairsList[i].token0_symbol,
//                 token1_symbol: swapPairsList[i].token1_symbol,
//                 index: transactionReceiptInfo.logs[k].index,
//                 time: new Date(blockInfo.timestamp * 1000),
//             },
//             type: Sequelize.QueryTypes.INSERT
//         });
//     }
// }