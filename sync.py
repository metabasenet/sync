#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import config
import pymysql
from web3 import Web3
from web3.middleware import geth_poa_middleware
# import json
from decimal import Decimal

web3 = Web3(Web3.HTTPProvider(config.rpcurl))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)

def getDbNumber():
    with connection.cursor() as cursor:
        sql = "select ifnull(max(`number`) + 1,0) as `number` from `block`"
        cursor.execute(sql)
        return cursor.fetchone()

def sync(begin,end):
    with connection.cursor() as cursor:
        for i in range(begin, end):
            b = web3.eth.get_block(i)
            txn = len(b.transactions)
            reward = 0
            for tx in b.transactions:
                reward = reward + 1
            sql = "insert `block`(`number`,`hash`,`timestamp`,txns,reward) values(%s,'%s',%s,%s,%s)" \
                % (i, b.hash.hex(),b.timestamp,txn,reward)
            cursor.execute(sql)
        connection.commit()


bn = getDbNumber()[0]
while True:
    bn1 = web3.eth.get_block_number()
    if bn1 > bn + 5000:
        sync(bn, bn + 5000)
        bn = bn + 5000
        print(bn)
    else:
        pass
