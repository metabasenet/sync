import config
import pymysql
import requests
import json

connection = pymysql.connect(host=config.host, port=config.port,
                             user=config.user, password=config.password, db=config.db)
# ssh -4NfL 6602:127.0.0.1:6602 mnt-xg
# insert into addr2(addr) SELECT distinct `to` as addr FROM tx;
rpcurl = 'http://127.0.0.1:6602'

def A():
    with connection.cursor() as cursor:
        sql = "select id, addr,addr_owner,balance from addr2 where addr_owner is null"
        cursor.execute(sql)
        datas = cursor.fetchall()
        for dr in datas:
            req = requests.post(rpcurl, json={
                'id': 1,
                'jsonrpc': '2.0',
                'method': 'getbalance',
                'params': {
                    "address": dr[1]
                }
            })
            resp = json.loads(req.content.decode('utf-8'))
            balance = resp["result"][0]["avail"]
            owner = dr[1]
            t = ''
            if dr[1][:1] == '2':
                req = requests.post(rpcurl, json={
                    'id': 2,
                    'jsonrpc': '2.0',
                    'method': 'validateaddress',
                    'params': {
                        "address": dr[1]
                    }
                })
                resp = json.loads(req.content.decode('utf-8'))
                if resp["result"]["addressdata"]["template"] == 'vote':
                    owner = resp["result"]["addressdata"]["templatedata"]["vote"]["owner"]
                    t = 'vote'
                if resp["result"]["addressdata"]["template"] == 'redeem':
                    owner = resp["result"]["addressdata"]["templatedata"]["redeem"]["owner"]
                    t = 'redeem'
            sql = "update addr2 set t = '%s', addr_owner = '%s', balance = %s where id = %s" % (
                t, owner, balance, dr[0])
            print(sql)
            cursor.execute(sql)
            connection.commit()

def B():
    with connection.cursor() as cursor:
        sql = 'select walletId, mnt_addr, balance from addr where balance is null'
        cursor.execute(sql)
        datas = cursor.fetchall()
        for dr in datas:
            sql = "select sum(balance) as balance FROM addr2 where addr_owner = '%s'" % (dr[1])
            cursor.execute(sql)
            balance = cursor.fetchone()[0]
            if balance == None:
                balance = 0
            print(balance, dr[1])
            sql = "update addr set balance = %s where walletId = '%s'" % (balance,dr[0])
            #print(sql)
            cursor.execute(sql)
            connection.commit()

B()