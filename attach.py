
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import pymysql
import time
from decimal import Decimal
from binascii import hexlify, unhexlify
import config
#import datetime
from datetime import datetime
import requests

url = config.url
connection = pymysql.connect(host=config.host, port=config.port, user=config.user, password=config.password, db=config.db)

def GetEndHeight():
    with connection.cursor() as cursor :
        sql = "select max(height) as h from block where is_useful = 1"
        cursor.execute(sql)
        ret = cursor.fetchone()
        if ret == None:
            return 0
        else:
            if ret[0] > 100:
                return ret[0] - 100
            else:
                return 0

def GetBeginHeight():
    with connection.cursor() as cursor :
        sql = "select height from blockcountstat order by id desc limit 1;"
        cursor.execute(sql)
        bs = cursor.fetchone()
        if bs == None:
            return 0
        else:
            return bs[0]

def blockcountstat():
    '''
    出块统计
    '''
    begin = GetBeginHeight()
    end = GetEndHeight()
    if end > begin:
        with connection.cursor() as cursor:
            sql = "select sum(reward_money) as m,max(height) as h,FROM_UNIXTIME(time,'%Y-%m-%d') as t,type,count(*) as c from block where is_useful = 1 and height between "+ str(begin+1) + " and " + str(end) + " group by t,type"
            cursor.execute(sql)
            ret = cursor.fetchall()
            info = {}
            for row in ret:
                if row[2] in info:
                    if row[3] == "primary-dpos":
                        info[row[2]]["dpos"] = row[0]
                    else:
                        info[row[2]]["pow"] = row[0]
                    info[row[2]]["h"] = max(info[row[2]]["h"],row[1])
                    info[row[2]]["c"] = info[row[2]]["c"] + row[4]
                else:
                    if row[3] == "primary-dpos":
                        info[row[2]] = {"dpos":row[0],"pow":0,"h":row[1],"c":row[4]}
                    else:
                        info[row[2]] = {"pow":row[0],"dpos":0,"h":row[1],"c":row[4]}
                    
            for key in info:
                sql = "select id from blockcountstat where d = '%s'" % key
                cursor.execute(sql)
                ret = cursor.fetchone()

                s = info[key]["pow"] + info[key]["dpos"]
                if ret == None:
                    y = datetime.strptime(key,'%Y-%m-%d').date().year
                    m = datetime.strptime(key,'%Y-%m-%d').date().month
                    sql = "insert blockcountstat(y,m,d,blockcount,pow_reward,stake_reward,total_reward,height)values(%d,%d,'%s',%d,%f,%f,%f,%f)"\
                        % (y,m,key,info[key]["c"],info[key]["pow"],info[key]["dpos"],s,info[key]["h"])
                else:
                    sql = "update blockcountstat set blockcount = blockcount + %d,pow_reward = pow_reward + %f,stake_reward = stake_reward + %f,total_reward = total_reward + %f,height = %d where id = %d" \
                         % (info[key]["c"],info[key]["pow"],info[key]["dpos"],s,info[key]["h"], ret[0])
                cursor.execute(sql)
            connection.commit()


# 投票统计
def votestatistic():
    sql = '''select addr, sum(dpos_in) - sum(dpos_out) as dpos from (
select dpos_in as addr, sum(amount) as dpos_in, 0 as dpos_out from tx where dpos_in is not null group by dpos_in
union
select dpos_out as addr,0 as dpos_in, sum(amount) as dpos_out from tx where dpos_out is not null group by dpos_out) A group by addr
'''
    with connection.cursor() as cursor:
        cursor.execute("select address,name from pool")
        ret = cursor.fetchall()
        pool = {}
        for row in ret:
            pool[row[0]] = row[1]

        cursor.execute(sql)
        ret = cursor.fetchall()
        s = 0
        for row in ret:
            s = s + row[1]
        for row in ret:
            today = int(time.mktime(datetime.now().date().timetuple()))
            yester = today - 24 * 60 * 60
            sql = "select count(*) as c from block where is_useful = 1 and reward_address = '%s'" % (row[0])
            cursor.execute(sql)
            cs = cursor.fetchone()
            all = 0
            if cs != None:
                all = cs[0]

            sql = "select count(*) as c from block where is_useful = 1 and reward_address = '%s' and time >= %d" % (row[0],today)
            cursor.execute(sql)
            cs = cursor.fetchone()
            today_ = 0
            if cs != None:
                today_ = cs[0]
            
            sql = "select count(*) as c from block where is_useful = 1 and reward_address = '%s' and time >= %d and time < %d;" % (row[0],yester,today)
            cursor.execute(sql)
            cs = cursor.fetchone()
            yester_ = 0
            if cs != None:
                yester_ = cs[0]
            
            name = ''
            if row[0] in pool:
                name = pool[row[0]]
            rate = row[1] * 100 / s
            
            sql = "select * from votestatistic where address = '%s'" % row[0]
            cursor.execute(sql)
            ret = cursor.fetchone()
            if ret == None:
                sql = "insert votestatistic(nodename,address,amount,rate,todaycount,yestercount,totalcount)values('%s','%s',%f,%f,%d,%d,%d)" \
                    % (name,row[0],row[1],rate,today_,yester_,all)
            else:
                sql = "update votestatistic set amount = %f,rate = %f,todaycount = %d,yestercount = %d,totalcount = %d where address = '%s'" \
                    % (row[1],rate,today_,yester_,all,row[0])
            cursor.execute(sql)
        connection.commit()


def rankstat():
    with connection.cursor() as cursor:
        sql = "SELECT max(height) as H FROM `block`"
        cursor.execute(sql)
        ret = cursor.fetchone()    
        totalMined = ret[0] * 730 + 200000000
        sql = "SELECT t.addr,SUM(i) - SUM(o) as total from (SELECT `from` as addr,SUM(amount + fee) as o, 0 as i FROM `tx` where `from` != '000000000000000000000000000000000000000000000000000000000' GROUP BY `from` \
            union SELECT `to` as addr, 0 as o, SUM(amount) as i FROM `tx` GROUP BY `to`) t GROUP BY addr ORDER BY total desc LIMIT 100;"
        cursor.execute("DELETE FROM `rank`")
        cursor.execute(sql)
        ret = cursor.fetchall()
        ranking = 1
        for row in ret:
            percent = row[1] / totalMined
            sql = "INSERT INTO `rank`(address,balance,yield,ranking) VALUES('%s',%f,%f,%d)" % (row[0], row[1],percent,ranking)
            ranking = ranking + 1
            cursor.execute(sql)
        connection.commit()
    
def listdelegate():
    with connection.cursor() as cursor:
        data = {
            "id":1,
            "method":"listdelegate",
            "jsonrpc":"2.0",
            "params":{}}
        response = requests.post(url, json=data)
        res = json.loads(response.text)
        for obj in res["result"]:
            sql = "SELECT id FROM pool where address = %s"
            cursor.execute(sql,[obj["address"]])
            ret = cursor.fetchone()
            print(ret)
            if ret == None:
                sql = "insert into pool(address,`votes`,`name`)value(%s,%s,'dpos name')"
                cursor.execute(sql,[obj["address"],obj["votes"]])
            else:
                sql = "update pool set `votes`= %s where address = %s"
                cursor.execute(sql,[obj["votes"],obj["address"]])
        connection.commit()

blockInit = 0
def blockstatisticsproc():
    global blockInit  
    with connection.cursor() as cursor:
        sql = "call blockstatisticsproc()"
        if blockInit == 0:             
            sql ="call blockstatisticsproc31()"
            blockInit = 1      
        cursor.execute(sql)
        print(blockInit, sql)
        connection.commit()
    
def Task():
    rankstat()
    listdelegate()
    blockstatisticsproc()   

if __name__ == '__main__':
    #blockstatisticsproc()

    #exit()
    while True:
        blockstatisticsproc()
        #blockcountstat()
        #votestatistic()
        #rankstat()
        #listdelegate()
        print(time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),"wait task 100s ...")
        time.sleep(10)