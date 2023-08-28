import { ethers, AbiCoder } from 'ethers'
import mysql from 'mysql'
import moment from 'moment'
import { abi_nft } from './json_nft.js'

const addr_nft = '0x895aD9A2DEb2d493635130b481A8e4E246945FEA'

const wsrpc = 'ws://47.115.211.205/wsrpc/'

const connJson = {
    host: '127.0.0.1',
    port: 3306,
    user: 'mnt',
    password: '1234qwer',
    database: 'mnt-scan'
}

let connection = mysql.createConnection(connJson)

let reConnect = 0

function ReConnecting() {
    connection.on('error', (err) => {
        reConnect++
        console.log('Re-connecting lost connection: ', err)
        connection = mysql.createConnection(connJson)
        ReConnecting()
    })
}

ReConnecting()

function query(sql, params) {
    return new Promise(fun => {
        connection.query(sql, params, (err, result) => {
            if (err) {
                fun(err)
                return
            }
            fun(result)
        })
    })
}

let c = 0
setInterval(async () => {
    const time = moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
    c = c + 1
    const sql = `select max(id) as id, ${c} as A from friends`
    const ret = await query(sql, [])
    console.log(time, ret[0], reConnect)
}, 1800 * 1000)

const provider = new ethers.WebSocketProvider(wsrpc)

const NFT = new ethers.Contract(addr_nft, abi_nft, provider)

async function nft(from, to, tokenId, bn, utc) {
    if (from == ethers.ZeroAddress) {
        const ret = await query('SELECT count(id) as c FROM nft WHERE tokenId = ?', [tokenId])
        if (ret[0].c == 0) {
            const sql = "insert into nft(mint_utc,tokenId,`owner`,utc,bn) values(?,?,?,?,?)"
            await query(sql, [utc, tokenId, to.toString().toLowerCase(), utc, bn])
        }
    } else {
        const sql = "update nft set `owner` = ?, utc = ?, bn = ? where tokenId = ?"
        await query(sql, [to.toString().toLowerCase(), utc, bn, tokenId])
    }
}

function subscribe() {
    NFT.on('Transfer', async (from, to, tokenId, event) => {
        const bn = event.blockNumber
        const utc = (await provider.getBlock(bn)).timestamp
        await nft(from, to, tokenId, bn, utc)
        console.log(`subscribe(${tokenId}): ${from} ==> ${to}`)
    })
}

async function sync(bn0, bn1) {
    const filter = NFT.filters.Transfer()
    const logs = await NFT.queryFilter(filter, bn0, bn1)
    const coder = AbiCoder.defaultAbiCoder()

    for (let i = 0; i < logs.length; i++) {
        const bn = logs[i].blockNumber
        const utc = (await provider.getBlock(bn)).timestamp
        const from = coder.decode(['address'], logs[i].topics[1])
        const to = coder.decode(['address'], logs[i].topics[2])
        const tokenId = coder.decode(['uint256'], logs[i].topics[3])
        await nft(from, to, tokenId, bn, utc)
        console.log(`sync(${tokenId}): ${from} ==> ${to}`)
    }
}

const data = await query('select ifnull(max(bn), 0) as bn from nft', [])
let bn = data[0].bn
while (true) {
    const bn1 = await provider.getBlockNumber()
    if (bn1 > bn + 5000) {
        await sync(bn, bn + 5000)
        bn = bn + 5000
        console.log(bn)
    } else {
        console.log('subscribe...')
        subscribe()
        await sync(bn, 'latest')
        console.log('latest')
        break
    }
}