#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import requests
import time
import config
import pymysql

def Update():
    try:
        conn = pymysql.connect(host=config.host, port=config.port, user=config.user, password=config.password, db=config.db)
        cursor = conn.cursor()
        url = 'https://dncapi.fxhapp.com/api/coin/web-coinrank?page=1&type=-1&pagesize=50&webp=1'
        #url ='https://shangqingdong.work/coin/'
    
        response = requests.get(url=url)
        objs = json.loads(response.text)
        sqls = []
        for obj in objs["data"]:
            if obj["name"] == 'BTC':
                sql = 'update quotations set price = %s,price24h = %s where tradePairId = "BTC/USDT"' \
                    % (obj["current_price_usd"],(obj["current_price_usd"] * 100) / (100 + obj["change_percent"]))
                sqls.append(sql)
            elif obj["name"] == "ETH":
                sql = 'update quotations set price = %s,price24h = %s where tradePairId = "ETH/USDT"' \
                    % (obj["current_price_usd"],(obj["current_price_usd"] * 100) / (100 + obj["change_percent"]))
                sqls.append(sql)
            elif obj["name"] == "BNB":
                sql = 'update quotations set price = %s,price24h = %s where tradePairId = "BNB/USDT"' \
                    % (obj["current_price_usd"],(obj["current_price_usd"] * 100) / (100 + obj["change_percent"]))
                sqls.append(sql)
            elif obj["name"] == "TRX":
                sql = 'update quotations set price = %s,price24h = %s where tradePairId = "TRX/USDT"' \
                    % (obj["current_price_usd"],(obj["current_price_usd"] * 100) / (100 + obj["change_percent"]))
                sqls.append(sql)
            elif obj["name"] == "XRP":
                sql = 'update quotations set price = %s,price24h = %s where tradePairId = "XRP/USDT"' \
                    % (obj["current_price_usd"],(obj["current_price_usd"] * 100) / (100 + obj["change_percent"]))
            else:
                pass
        for sql in sqls:
            print(sql)
            cursor.execute(sql)
        conn.commit()
    except Exception as r:
        print('%s' %(r))

if __name__ == '__main__':
    while True:
        Update()
        time.sleep(120)
