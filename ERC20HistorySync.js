import { ethers } from "ethers";
import { Contract } from "./models/contract.js";
import { TransactionErc20 } from "./models/transaction_erc20.js"

const provider = new ethers.JsonRpcProvider("https://test.metabasenet.site/rpc");

const contractAddressList = await Contract.findAll({
    attributes: ['contractAddress']
})

for (let i in contractAddressList) {
    console.log(contractAddressList[i].contractAddress)
    const eventAbi = [
        "event Transfer(address indexed from, address indexed to, uint256 value)"
    ];
    const contract = new ethers.Contract(contractAddressList[i].contractAddress, eventAbi, provider);
    let blockNumber = await provider.getBlockNumber();
    try {
        const transferEvents = await contract.queryFilter('Transfer', 0, blockNumber);
        if (transferEvents !== undefined && transferEvents.length > 0) {
            for (let i in transferEvents) {
                console.log(transferEvents[1]);
                await TransactionErc20.create({
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

