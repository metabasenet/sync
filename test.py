# 
import requests
url = 'https://rest.coinapi.io/v1/exchanges'
headers = {'X-CoinAPI-Key' : '73034021-THIS-IS-SAMPLE-KEY'}
response = requests.get(url, headers=headers)
print(response.text)