#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pymysql
import config
import time
import requests

conn = pymysql.connect(host=config.host, port=config.port, user=config.user, password=config.password, db=config.db)


#bridge_addr = '1231kgws0rhjtfewv57jegfe5bp4dncax60szxk8f4y546jsfkap3t5ws'
bridge_addr = '184aph9nn415fam29hwmk5h19kc1724ysqjsfm8j1gndm3j32ywyvj796'

except_addr = '000000000000000000000000000000000000000000000000000000000'

if __name__ == '__main__':
    while True:
        ## add
        with conn.cursor() as cursor :
            ts = time.time() - 100
            sql = f"select txid, `from`, amount from tx where `to` = '{bridge_addr}' and `from` != '{except_addr}' and transtime < {ts} order by id desc limit 1000;"
            cursor.execute(sql)
            result = cursor.fetchall()
            for obj in result:
                sql = f"select * from mnt_bsc where mnt_txid = '{obj[0]}';"
                cursor.execute(sql)
                result = cursor.fetchall()
                if len(result) == 0:
                    ts = int(time.time())
                    sql = f"INSERT INTO mnt_bsc(mnt_txid,`from`,`to`,`value`,`type`,mnt_time) VALUES('{obj[0]}','{obj[1]}','{bridge_addr}',{obj[2]},2,{ts})"
                    print(sql)
                    cursor.execute(sql)
                    print('add ok.')
                else:
                    print('Data already exists')
            conn.commit()
        
        print('time.sleep(10)...')
        time.sleep(10)
        ## mod
        with conn.cursor() as cursor :
            sql = 'select mnt_bsc.`value`,addr.mnt_addr as `to`,mnt_bsc.id from mnt_bsc inner join addr on addr.eth_addr = mnt_bsc.`from` where mnt_bsc.state is null and mnt_bsc.`type` = 1'
            cursor.execute(sql)
            result = cursor.fetchall()
            for obj in result:
                data = {"id":1,
                        "method":"sendfrom",
                        "jsonrpc":"2.0",
                        "params": {
                            "from": bridge_addr,
                            "to": obj[1],
                            "amount": str(obj[0])
                        }}
                print('data',data);
                ret = requests.post(config.url, json=data)
                txid = ret.text.strip()
                ts = int(time.time())
                sql = f"update mnt_bsc set mnt_txid = '{txid}', state = 1, bsc_time = {ts} where id = {obj[2]}"
                cursor.execute(sql)
                print('bsc -> bbc OK.')
            conn.commit()
        print('time.sleep(10)...')
        time.sleep(10)
        