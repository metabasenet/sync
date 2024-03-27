import { ethers } from "ethers";
import { sqlHelper } from "./database/sqlHelper.js";
import { RunConfig } from "./RunConfig.js";


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
                provider.getBalance(result[i].address).then(balance => {
                    const address = result[i].address;
                    let insertSql = `REPLACE  INTO platform_balance(address, balance, updateTime) VALUES ('${address}', ${balance}, ?)`;
                    sqlHelper.writeDatabase(insertSql, new Date());
                })
            }
        }
    }
};

main();