#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from distutils.log import debug
from colorama import Cursor
import requests
import json
import pymysql
import time
from decimal import Decimal
from binascii import hexlify, unhexlify
import config
import attach
import utils
import decimal

url = config.url
connection = pymysql.connect(host=config.host, port=config.port, user=config.user, password=config.password, db=config.db)

def ExecSql(sql):
    try:
        cursor = connection.cursor()
        cursor.execute(sql)
        connection.commit()
        return cursor.lastrowid
    except Exception as e:
        return 0


def GetTask():
    with connection.cursor() as cursor:
        sql = 'SELECT id,block_hash from Task where is_ok = 0 limit 1'
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()


def SbumitTask(taskid):
    with connection.cursor() as cursor:
        sql = 'update Task set is_ok = 1 where id = %s' % taskid
        cursor.execute(sql)
        connection.commit()


def GetBlock(block_hash):
    with connection.cursor() as cursor:
        sql = 'select `hash`,prev_hash,height from block where hash = "%s"' % block_hash
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()

def GetUsefulBlock(block_hash):
    with connection.cursor() as cursor:
        sql = 'select `hash`,prev_hash,height from block where is_useful = 1 and hash = "%s"' % block_hash
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()


def GetVote(hex_str):
    dpos_addr = utils.Hex2Addr(hex_str[0:66])
    client_addr = utils.Hex2Addr(hex_str[66:132])
    return client_addr,dpos_addr

def GetDbVote(sendto):
    with connection.cursor() as cursor:
        sql = 'select client_in, dpos_in from tx where type = "token" and `to` = "%s"' % sendto
        cursor.execute(sql)
        res = cursor.fetchone()
        return res[0],res[1]

def InsertTx(block_id,tx,cursor,height):
    if tx["type"] == "certification":
        return
    #print("txid:",tx["txid"])
    in_money = Decimal(0)
    dpos_in = None
    client_in = None
    dpos_out = None
    client_out = None
    if tx["to"][:4] == "20w0":
        if len(tx["data"]) < 100:
            client_in,dpos_in = GetDbVote(tx["to"])
        else:
            client_in,dpos_in = GetVote(tx["data"][8:])
        
    if tx["from"][:4] == "20w0":
        client_out,dpos_out = GetDbVote(tx["from"])
    data = None
    if len(tx["data"]) > 0 and tx["to"][:4] != "20w0":
        data = tx["data"]
        if tx["type"] == 'certification':
            data = 'certification'
        elif len(data) >= 4096:
            data = data[:4096]
    sql = "insert tx(block_hash,txid,`from`,`to`,amount,fee,`type`,`data`,dpos_in,client_in,dpos_out,client_out,transtime,height,nonce)values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)"
    cursor.execute(sql,[block_id,tx["txid"], tx["from"],tx["to"],tx["amount"],tx["txfee"],tx["type"],data,dpos_in,client_in,dpos_out,client_out,tx["time"],height,tx['nonce']])

    if tx["type"] == 'defi-relation':
        sql = "insert relation(upper,lower,txid,created_at) value(%s,%s,%s,%s)"
        cursor.execute(sql,[tx["from"],tx["to"],tx["txid"],tx["time"]])

    if tx["type"] == 'defi-reward':
        vote = int(tx['data'][-64:],16) 
        vote = decimal.Decimal(vote) / decimal.Decimal(10**18)
        extend = decimal.Decimal(tx["amount"]) - vote
        sql = 'insert reward(vote,extend,height,`time`,txid,addr)value(%s,%s,%s,%s,%s,%s)'
        cursor.execute(sql,[vote,extend,height,tx['time'],tx['txid'],tx['to']])

    
def RollBACK(block_hash):
    with connection.cursor() as cursor:
        sql = "update block set is_useful = 0 where `hash` = '%s'" % block_hash
        cursor.execute(sql)
        sql = "SELECT txid from tx where block_hash = '%s' ORDER BY id desc" % block_hash
        cursor.execute(sql)
        rows = cursor.fetchall()
        for row in rows:
            sql = "Delete from tx where txid = '%s'" % row[0]
            cursor.execute(sql)
        connection.commit()

def Useful(block_hash):
    with connection.cursor() as cursor:
        data = {"id":1,
                "method":"getblockdetail",
                "jsonrpc":"2.0",
                "params":{"block": block_hash}
                } 
        response = requests.post(url, json=data)
        obj = json.loads(response.text)
        if "result" in obj:
            obj = obj["result"]
        else:
            return False
        txs =  len(obj["tx"]) + 1
        if GetBlock(block_hash) == None:
            sql = "insert into block(hash,prev_hash,time,height,reward_address,bits,reward_money,type,txs) values(%s,%s,%s,%s,%s,%s,%s,%s,%s)"
            cursor.execute(sql,[obj["hash"],obj["hashPrev"],obj["time"],obj["height"],obj["txmint"]["to"],obj["bits"],obj["txmint"]["amount"],obj["type"],txs])
        else:
            sql = "update block set is_useful = 1 where `hash` = '%s'" % block_hash
            cursor.execute(sql)
        
        InsertTx(block_hash,obj["txmint"],cursor,obj["height"])
        for tx in obj["tx"]:
            InsertTx(block_hash,tx,cursor,obj["height"])
        connection.commit()
        return True

def GetEndData():
    with connection.cursor() as cursor :
        sql = "SELECT `hash`, prev_hash,height from block ORDER BY id DESC LIMIT 1"
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()

def GetPrev(b_hash):
    sql = "SELECT b2.`hash`,b2.prev_hash,b2.height from block b1 inner JOIN block b2 on b1.prev_hash = b2.`hash` where b1.`hash` = '%s'" % b_hash
    with connection.cursor() as cursor :
        cursor.execute(sql)
        connection.commit()
        return cursor.fetchone()

def UpdateState(prev_hash,height):
    p2_hash = None # RollBACK end block
    p2_height = 0
    p3_hash = prev_hash # current prev block (P2 may not equal P3)
    p3_height = height
    
    RollBack = []
    UseBlock = []
    end_data = GetEndData()
    p2_hash = end_data[0]
    p2_height = end_data[2]
    if p2_hash == p3_hash:
        return
    if p2_height > p3_height:
        RollBack.append(p2_hash)
        while True:
            res = GetPrev(p2_hash)
            p2_height = res[2]
            p2_hash = res[0]
            if res[2] == p3_height:
                break
            RollBack.append(p2_hash)
    elif p3_height > p2_height:
        UseBlock.append(p3_hash)
        while True:
            res = GetPrev(p3_hash)
            p3_height = res[2]
            if res[2] == p2_height:
                break
            p3_hash = res[0]
            UseBlock.append(p3_hash)
    
    while p2_hash != p3_hash:
        RollBack.append(p2_hash)
        
        res2 = GetPrev(p2_hash)
        p2_hash = res2[0]
        
        res3 = GetPrev(p3_hash)
        p3_hash = res3[0]
        if p2_hash != p3_hash:
            UseBlock.append(p3_hash)

    for cancel_hash in RollBack:
        RollBACK(cancel_hash)

    UseBlock.reverse()
    for use_hash in UseBlock:
        Useful(use_hash)

def ExecTask(block_hash):
    task_add = []
    db_res = GetUsefulBlock(block_hash)
    while db_res == None:
        #print(block_hash,"dddd")
        #time.sleep(30000)
        task_add.append(block_hash)
        data = {"id":1,
                "method":"getblock",
                "jsonrpc":"2.0",
                "params":{"block": block_hash}
                }
        response = requests.post(url, json=data)
        res = json.loads(response.text)
        if "result" in res:
            res = res["result"]
        else:
            print("RollBack",block_hash)
            return
        block_hash = res["hashPrev"]
        print(res["height"])
        if res["height"] == 0:
            break
        db_res = GetUsefulBlock(block_hash)
    if db_res != None:
        UpdateState(db_res[0],db_res[2])

    task_add.reverse()
    for use_hash in task_add:
        print("begin", use_hash)
        if Useful(use_hash) == False:
            print("use_hash Error",use_hash)
            return

def Getblockhash(height):
    data = {"id":1,
            "method":"getblockhash",
            "jsonrpc":"2.0",
            "params":{
                "height":height
            }}
    response = requests.post(url, json=data)
    return json.loads(response.text)

def Getforkheight():
    data = {"id":2,
            "method":"getforkheight",
            "jsonrpc":"2.0",
            "params":{ 
            }}

    response = requests.post(url, json=data)
    obj = json.loads(response.text)
    if "result" in obj:
        obj = obj["result"]
    else:
        return False
    
    end_data = GetEndData()
    if end_data == None:
        return 1
    if obj > end_data[2]:
        if (obj - end_data[2]) > 100:
            return end_data[2] + 100
        return obj
    else:
        return 0

def Run():
    height = Getforkheight()
    if height > 0:
        obj = Getblockhash(height)
        if "result" in obj:
            blockHash = obj["result"][-1]
            ExecTask(blockHash) 
        else:
            print("getblockhash error:",obj)   
            time.sleep(3)
def insertRewardDetail():     
   
    with connection.cursor() as cursor:
        sql="select id,vote,extend,height,time,txid,addr  from  reward where flag is null or flag !=1" 
        #sql="select id,vote,extend,height,time,txid,addr  from  reward where id =7 or id=8" 
        cursor.execute(sql)
        rows = cursor.fetchall()
        for row in rows:
            #print(row[0])
            #print(row[6])
            
            if (row[6][0:3] =="20w"):
                data={"id":2,
                "method":"validateaddress",
                "jsonrpc":"2.0",
                "params":{"address":row[6]}}
                response = requests.post(url, json=data)
                obj = json.loads(response.text)
             
                owner=obj["result"]["addressdata"]["templatedata"]["vote"]["owner"]
                relationObj=owner
                parent=owner
                addressList=[]
                #print(row[0])
                #print(relationObj)
                addressList.append(parent) 
                while "error" not in relationObj:                                                   
                    relationData={"id":1,
                    "method":"getdefirelation",
                    "jsonrpc":"2.0","params":
                    {"address":parent}}
                    relationResponse=requests.post(url,json=relationData)
                    relationObj=json.loads(relationResponse.text)
                    if "error" not in relationObj:                      
                        parent=relationObj["result"]["parent"]
                        if parent !="000000000000000000000000000000000000000000000000000000000":
                            addressList.append(parent) 
                
                print(addressList)
                updateRewardDetail(row[0],row[4],addressList,row[3],float(row[1])+ float(row[2]))  
                #time.sleep(10)
            elif(row[6][0:3]=="20m"):
                # with connection.cursor() as cursor:
                #     updateSql="update reward set flag =1 where id=%s"
                #     cursor.execute(updateSql,[id])
                # connection.commit()
                print(row[6])
            else:
                addressList=[]
                addressList.append(row[6])
                updateRewardDetail(row[0],row[4],addressList,row[3],float(row[1])+ float(row[2]))
                print(row[6][0:3])  
                #time.sleep(10)     
        #print(obj)
def updateRewardDetail(id,time,addressList,height,profit):
    for address in addressList:
        with connection.cursor() as cursor:
            #print(address)
            blockHeight=(int(height) // 2880) * 2880
            selectSql = "SELECT id,profit, height, addr from rewarddetail where addr = %s and `height`=%s"
            cursor.execute(selectSql,[address,blockHeight])
            row= cursor.fetchone()
            # print(address)
            # print(blockHeight)
            # print(row)
            if row is not None:
                #update
                oldProfit=row[1]
                print (oldProfit)
                updateSql="update rewarddetail set profit=%s where addr=%s and height=%s"
                cursor.execute(updateSql,[oldProfit+Decimal(profit),address,blockHeight])
            else:
                #insert
                insertSql="insert into rewarddetail(profit, height ,time ,addr) values(%s,%s,%s,%s)"
                cursor.execute(insertSql,[profit,blockHeight,time,address])
        connection.commit()
    with connection.cursor() as cursor:
        updateSql="update reward set flag =1 where id=%s"
        cursor.execute(updateSql,[id])
    connection.commit()
# certification dpos 
# invest-reward 
if __name__ == '__main__':
    #data = "010101460205000b5d642a6844d36b84b00c72c01e221cbb7421c03069888e828ec461e9400129136f7de86c7a7c13a404cb2401e112f53b5df6c4ac11916c83312aa4c3aff300000000"
    #print(GetVote(data))
    #print("owner:",owner)
    #print("inviter:",inviter)   
    #insertRewardDetail()
    #exit()
    while True:
        height = Getforkheight()
        if height > 0:
            obj = Getblockhash(height)
            print("obj:",obj)
            if "result" in obj:
                blockHash = obj["result"][-1]
                ExecTask(blockHash) 
            else:
                print("getblockhash error:",obj)   
                time.sleep(3)                    
                attach.Task()
        else:
            print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),"wait task 3s ...")
            time.sleep(3)
            attach.Task()
        insertRewardDetail()
