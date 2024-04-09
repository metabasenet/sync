import { ethers } from "ethers";
import { sqlHelper } from "./database/sqlHelper.js";
import { RunConfig } from "./RunConfig.js";
import fs from "fs";

const provider = new ethers.JsonRpcProvider(RunConfig.ChainUrl);

function main() {
    sqlHelper.init();
    const selectSql = "SELECT  DISTINCT address  from (SELECT DISTINCT `from` AS address FROM `transaction` UNION SELECT DISTINCT `to` AS address FROM `transaction`) A";
    sqlHelper.readDatabase(selectSql, getAddressCallback);

    function getAddressCallback(err, result) {
        if (err) {
            console.log(err.message);
        } else {
            for (let i in result) {
                if (result[i].address !== null) {
                    provider.getBalance(result[i].address).then(balance => {
                        if (balance !== null) {
                            const address = result[i].address;
                            let insertSql = `REPLACE  INTO platform_balance(address, balance, updateTime) VALUES ('${address}', ${balance}, ?)`;
                            sqlHelper.writeDatabase(insertSql, new Date());
                        }
                    })
                }
            }
        }
    }

    
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
};

main();