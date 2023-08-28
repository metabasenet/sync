#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import config
import pymysql
from web3 import Web3
from web3.middleware import geth_poa_middleware
# import json
from decimal import Decimal
import time


web3 = Web3(Web3.HTTPProvider(config.rpcurl))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)


def getDbNumber():
    with connection.cursor() as cursor:
        sql = "select ifnull(max(`number`) + 1,0) as `number` from `block`"
        cursor.execute(sql)
        return cursor.fetchone()


def sync(begin, end):
    with connection.cursor() as cursor:
        for i in range(begin, end):
            b = web3.eth.get_block(i)
            txn = len(b.transactions)
            reward = Decimal(0)
            txs = []
            for txid in b.transactions:
                txid = txid.hex()
                tx = web3.eth.get_transaction(txid)
                txr = web3.eth.get_transaction_receipt(txid)
                fee = Decimal(txr.gasUsed * txr.effectiveGasPrice) / 10**18
                value = Decimal(tx.value) / 10**18
                reward = reward + fee
                if tx.to == None:
                    to = '0x0000000000000000000000000000000000000000'
                else:
                    to = tx.to.lower()
                txs.append([txid, i, tx['from'].lower(), to, value, fee])
            sql = "insert `block`(`number`,`hash`,`timestamp`,txns,reward) values(%s,'%s',%s,%s,%s)" \
                % (i, b.hash.hex(), b.timestamp, txn, reward)
            cursor.execute(sql)
            sql = "insert `tx`(`hash`,`number`,`from`,`to`,`value`,method,fee) values(%s,%s,%s,%s,%s,'Transfer',%s)"
            cursor.executemany(sql, txs)
        connection.commit()


bn = getDbNumber()[0]
while True:
    bn1 = web3.eth.get_block_number()
    if bn1 > bn + 5000:
        print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()), bn, bn1)
        sync(bn, bn + 5000)
        bn = bn + 5000
    else:
        print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()), bn, bn1)
        sync(bn, bn1)
        break

print('OK')