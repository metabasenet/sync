#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright (c) ***
'''
import config
import pymysql
from web3 import Web3
from web3.middleware import geth_poa_middleware
import json
from decimal import Decimal

factory = json.load(open('./abi/factory.json'))
pair = json.load(open('./abi/pair.json'))
erc20 = json.load(open('./abi/erc20.json'))

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)

web3 = Web3(Web3.HTTPProvider(config.url))
web3.middleware_onion.inject(geth_poa_middleware, layer=0)


def ExecSql(sql):
    try:
        cursor = connection.cursor()
        cursor.execute(sql)
        connection.commit()
        return cursor.lastrowid
    except Exception as e:
        return 0


def GetTx(txid):
    with connection.cursor() as cursor:
        sql = "SELECT count(*) as c FROM K where txid = '%s'" % txid
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()


def add_pair(id, bn0, bn1, pair_addr, decimals0, decimals1):
    Pair = web3.eth.contract(address=pair_addr, abi=pair)
    Sync_filter = Pair.events.Sync.create_filter(fromBlock=bn0, toBlock=bn1)
    for sync in Sync_filter.get_all_entries():
        txid = sync.transactionHash.hex()
        if GetTx(txid)[0] == 0:
            utc = web3.eth.get_block(sync.blockNumber).timestamp
            data = web3.eth.get_transaction_receipt(txid)
            for log in data.logs:
                if log.topics[0].hex() == '0x1c411e9a96e071241c2f21f7726b17ae89e3cab4c78be50e062b03a9fffbbad1':
                    reserve0 = Decimal(int(log.data[:32].hex(), 16))
                    reserve1 = Decimal(int(log.data[32:].hex(), 16))
                    v0 = Decimal(reserve0)
                    v1 = Decimal(reserve1)
                    v0 = v0 / (10 ** decimals0)
                    v1 = v1 / (10 ** decimals1)
                    price = (v1 / v0)

                    sql = "insert K(pair_id,utc,txid,reserve0,reserve1,price)value (%s,%s,'%s',%s,%s,%s)" \
                        % (id, utc, txid, reserve0, reserve1, price)
                    ExecSql(sql)


def task_pair():
    bn1 = web3.eth.block_number
    with connection.cursor() as cursor:
        sql = 'select id,bn,addr,decimals0,decimals1,token0,token1,name0,name1 from pair2'
        cursor.execute(sql)
        data = cursor.fetchall()
        for obj in data:
            id = obj[0]
            bn1_ = bn1
            bn0 = obj[1]
            if bn1_ > bn0 + 5000:
                bn1_ = bn0 + 5000
            add_pair(id, bn0, bn1_, obj[2], obj[3], obj[4])
            print('task_pair', id, bn0, bn1_, obj[2], obj[3], obj[4])
            sql = 'update pair2 set bn = %s where id = %s' % (bn1_, id)
            ExecSql(sql)
        sql ='delete from K where utc < (unix_timestamp(now()) - (40 * 24 * 3600))'
        ExecSql(sql)
        
'''