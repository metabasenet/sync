from urllib import response
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

#create table address(id varchar(64), privkey varchar(64), pubkey varchar(64), address varchar(64) ,
 #dposaddress varchar(64), templateaddress varchar(64));
def createAddress():   
    with connection.cursor() as cursor:
        for index in range(1,2):
            #get privkey and pubkey 
            data={"id":42,"method":"makekeypair","jsonrpc":"2.0","params":{}}
            response=requests.post(url,json=data)
            obj=json.loads(response.text)
            print(index)
            print(obj)
            '''
                  #get address
            addressData={"id":44,"method":"getpubkeyaddress","jsonrpc":"2.0","params":{"pubkey": obj['result']['pubkey']}}
            #print(addressData)
            addressResponse=requests.post(url,json=addressData)
            addressObj=json.loads(addressResponse.text)
            print(addressObj)            
            sql ="insert into address (id,privkey,pubkey) values(%s,%s,%s)"
            cursor.execute(sql,[index,obj['result']['privkey'], obj['result']['pubkey']])
            '''
      
        #connection.commit()
createAddress()