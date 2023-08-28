#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright (c) ***

'''
import config
from web3 import Web3
import json
import pymysql

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)

web3 = Web3(Web3.HTTPProvider(config.url))

factory = json.load(open('./abi/factory.json'))
pair = json.load(open('./abi/pair.json'))
erc20 = json.load(open('./abi/erc20.json'))


def ExecSql(sql):
    try:
        cursor = connection.cursor()
        cursor.execute(sql)
        connection.commit()
        return cursor.lastrowid
    except Exception as e:
        return 0


def GetPair(addr_pair):
    with connection.cursor() as cursor:
        sql = "select id,bn,decimals0,decimals1,token0,token1,name0,name1 from pair2 where addr = '%s'" % addr_pair
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()


def add_pair(addr_pair):
    Pair = web3.eth.contract(address=addr_pair, abi=pair)
    addr_token0 = Pair.functions.token0().call()
    addr_token1 = Pair.functions.token1().call()
    Token0 = web3.eth.contract(address=addr_token0, abi=erc20)
    Token1 = web3.eth.contract(address=addr_token1, abi=erc20)
    decimals0 = Token0.functions.decimals().call()
    decimals1 = Token1.functions.decimals().call()
    name0 = Token0.functions.symbol().call()
    name1 = Token1.functions.symbol().call()
    sql = "insert pair2(bn,decimals0,decimals1,token0,token1,name0,name1,addr) value(%s,%s,%s,'%s','%s','%s','%s','%s')" \
        % (config.sync_height, decimals0, decimals1, addr_token0, addr_token1, name0, name1, addr_pair)
    ExecSql(sql)


def task_factory():
    Factory = web3.eth.contract(address=config.addr_factory, abi=factory)
    n = Factory.functions.allPairsLength().call()
    for i in range(n):
        addr_pair = Factory.functions.allPairs(i).call()
        if GetPair(addr_pair) == None:
            add_pair(addr_pair)
        print('task_factory', i, addr_pair)
'''