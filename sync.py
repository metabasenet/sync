#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import config
import pymysql
from web3 import Web3
from web3.middleware import geth_poa_middleware
from decimal import Decimal
import time

import asyncio
from web3.middleware import async_geth_poa_middleware
from web3 import AsyncWeb3
from web3.providers import WebsocketProviderV2

web3 = Web3(Web3.WebsocketProvider(config.rpcws))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)


def get_db_number():
    with connection.cursor() as cursor:
        sql = "select ifnull(max(`number`) + 1,0) as `number` from `block`"
        cursor.execute(sql)
        return cursor.fetchone()[0]


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


def sync_history():
    bn = get_db_number()
    while True:
        bn_max = web3.eth.get_block_number()
        if bn_max > bn + 5000:
            print(time.strftime("%Y-%m-%d %H:%M:%S syncing",
                  time.localtime()), f"from:{bn},to:{bn + 5000},max:{bn_max}")
            sync(bn, bn + 5000)
            bn = bn + 5000
        else:
            print(time.strftime("%Y-%m-%d %H:%M:%S sync_complete",
                  time.localtime()), f"from:{bn},to:{bn_max}")
            sync(bn, bn_max + 1)
            break


async def subscription_newHeads():
    async with AsyncWeb3.persistent_websocket(WebsocketProviderV2(config.rpcws)) as w3:
        w3.middleware_onion.inject(async_geth_poa_middleware, layer=0)
        subscription_id = await w3.eth.subscribe("newHeads")
        while True:
            async for block in w3.listen_to_websocket():
                bn = get_db_number()
                number = int(block.number, 16)
                sync(bn, number + 1)
                print(time.strftime("%Y-%m-%d %H:%M:%S subscribe",
                      time.localtime()), f"from:{bn},to:{number}")
        await w3.eth.unsubscribe(subscription_id)
#print(web3.api)
sync_history()
asyncio.run(subscription_newHeads())
