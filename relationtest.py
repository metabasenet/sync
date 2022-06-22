import hashlib
import ed25519
from binascii import hexlify, unhexlify

# https://github.com/BigBang-Foundation/BigBang/wiki/DeFi%E7%9B%B8%E5%85%B3
# 

def Sub(sub_privkey,forkid,shared_pubkey):
    sub_sign_str = "DeFiRelation" + forkid + shared_pubkey
    blake2b = hashlib.blake2b(digest_size=32)
    blake2b.update(sub_sign_str.encode())
    sub_sign_hash_str = blake2b.hexdigest()
    sk = ed25519.SigningKey(unhexlify(sub_privkey)[::-1])
    sub_sign = hexlify(sk.sign(unhexlify(sub_sign_hash_str))).decode()
    return sub_sign

def Par(parent_pubkey,shared_privkey):
    parent_sign_str = "DeFiRelation" + parent_pubkey
    blake2b = hashlib.blake2b(digest_size=32)
    blake2b.update(parent_sign_str.encode())
    parent_sign_hash_str = blake2b.hexdigest()
    sk = ed25519.SigningKey(unhexlify(shared_privkey)[::-1])
    parent_sign = hexlify(sk.sign(unhexlify(parent_sign_hash_str))).decode()
    return parent_sign

def Test():
    # 1
    sub_privkey = '1dc5a5956c2de69f597cf20da70523b024470ae789e1d2bfc157c9605f17a33a'
    sub_pubkey = '70147f8485c30dd50fc995f2f0b6a192bed4882be226747a51c7ee9a04d6299e'
    sub_address = '1krmxc14txv3n2ykm4vh2q26mqt9a3dqgyaawj3yn1q1rb13z2hrfxzsp'
    # 2
    parent_key = 'e7c5dbf5ff2d8157993fa8e5128791d8fa3c55a70540f3ca2a5bc86542cb5393'
    parent_pubkey = '3bdc5190cd3283c81d6b7a186610ce4ada5e81c4f7fcb153b379afc6154d0014'
    parent_address = '12g04t5e6nxwv6mxhzkvw90ayv95cw43631x6p7e8gcscv42hvgxqm0z2'

    # 3
    shared_privkey = '15c02b5f9eb6e516159c230011a87e57757645b53d3534958f910c08feb5c203'
    shared_pubkey = '06c4246621002576ec70545f04f2cb75378e3f1a16eca2c596fc1c64f52e122b'
    # 4
    forkid = '00000000b0a9be545f022309e148894d1e1c853ccac3ef04cb6f5e5c70f41a70'

    # 5
    sub_sign = Sub(sub_privkey,forkid,shared_pubkey)
    print(sub_sign)

    # 6
    parent_sign = Par(parent_pubkey,shared_privkey)
    print(parent_sign)

    # 7
    vchData = hexlify(unhexlify(shared_pubkey)[::-1]).decode()
    vchData = vchData + sub_sign + parent_sign
    ret = "2b122ef5641cfc96c5a2ec161a3f8e3775cbf2045f5470ec762500216624c406eb3540abf61b9cf57caef4a7c24054a5b8dfcb382de053b5377fcd76f05409f120d61b501c17745a676bc78197f456bc303be3d64a89aad69c587ba6ac86cf0cc18283ceee6edf121c8bf4fb6ced8871e5e6020cb92419f710b6d588ee8fd2430f0f5f9fde8ede8f23f42269033be259d2a8aab3a7558f9a44a2e57040ddd301"
    assert(ret == vchData)

def test_mnt():
    sub_privkey = '1dc5a5956c2de69f597cf20da70523b024470ae789e1d2bfc157c9605f17a33a'
    sub_pubkey = '70147f8485c30dd50fc995f2f0b6a192bed4882be226747a51c7ee9a04d6299e'
    sub_address = '1krmxc14txv3n2ykm4vh2q26mqt9a3dqgyaawj3yn1q1rb13z2hrfxzsp'

    parent_key = '9ae89671cc1a74e9e404a16982ae48d21c56d4ad8278bc9755235a68fc841271'
    parent_pubkey = 'ac9a2f4b438a270fcdfe33305db1da885dc53de8e4299bbba765c4207338c310'
    parent_address = '1231kgws0rhjtfewv57jegfe5bp4dncax60szxk8f4y546jsfkap3t5ws'

    #Address: 1231kgws0rhjtfewv57jegfe5bp4dncax60szxk8f4y546jsfkap3t5ws
    #PubKey : ac9a2f4b438a270fcdfe33305db1da885dc53de8e4299bbba765c4207338c310
    #Secret : 9ae89671cc1a74e9e404a16982ae48d21c56d4ad8278bc9755235a68fc841271


    # 3
    shared_privkey = '15c02b5f9eb6e516159c230011a87e57757645b53d3534958f910c08feb5c203'
    shared_pubkey = '06c4246621002576ec70545f04f2cb75378e3f1a16eca2c596fc1c64f52e122b'
    # 4
    forkid = '000000005f7ef624ac7ef5f929dbca7e1146d888a29d7455ff7246312cdf62a3'


    sub_sign = Sub(sub_privkey,forkid,shared_pubkey)
    #print(sub_sign)

    # 6
    parent_sign = Par(parent_pubkey,shared_privkey)
    #print(parent_sign)

    # 7
    vchData = hexlify(unhexlify(shared_pubkey)[::-1]).decode()
    vchData = vchData + sub_sign + parent_sign
    #print(vchData)
    cmd = "sendfrom %s %s 0.01 -t=1 -d=%s" % (parent_address,sub_address,vchData)
    print(cmd)
    cmd = "getdefirelation -f=%s -a=%s" % (forkid,sub_address)
    print(cmd)

if __name__ == '__main__':
    test_mnt()
    exit()
    sub_privkey = '1dc5a5956c2de69f597cf20da70523b024470ae789e1d2bfc157c9605f17a33a'
    sub_pubkey = '70147f8485c30dd50fc995f2f0b6a192bed4882be226747a51c7ee9a04d6299e'
    sub_address = '1krmxc14txv3n2ykm4vh2q26mqt9a3dqgyaawj3yn1q1rb13z2hrfxzsp'

    parent_key = 'ab14e1de9a0e805df0c79d50e1b065304814a247e7d52fc51fd0782e0eec27d6'
    parent_pubkey = '68e4dca5989876ca64f16537e82d05c103e5695dfaf009a01632cb33639cc530'
    parent_address = '1632srrskscs1d809y3x5ttf50f0gabf86xjz2s6aetc9h9ewwhm58dj3'

    # 3
    shared_privkey = '15c02b5f9eb6e516159c230011a87e57757645b53d3534958f910c08feb5c203'
    shared_pubkey = '06c4246621002576ec70545f04f2cb75378e3f1a16eca2c596fc1c64f52e122b'
    # 4
    forkid = '00000001cf57212c59faebd3409ae04291c7628cb0d7de8897682a9ac587627e'


    sub_sign = Sub(sub_privkey,forkid,shared_pubkey)
    #print(sub_sign)

    # 6
    parent_sign = Par(parent_pubkey,shared_privkey)
    #print(parent_sign)

    # 7
    vchData = hexlify(unhexlify(shared_pubkey)[::-1]).decode()
    vchData = vchData + sub_sign + parent_sign
    #print(vchData)
    cmd = "sendfrom %s %s 0.01 -f=%s -type=2 -d=%s" % (parent_address,sub_address,forkid,vchData)
    print(cmd)
    cmd = "getdefirelation -f=%s -a=%s" % (forkid,sub_address)
    print(cmd)