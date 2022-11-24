import time
def init():

    MNT_BEGIN = 1666317582
    height = 2927
    whole_weight = 811540842283913001
    whole_quantity = 5342173260496829271933

    ### 0x87391240190aB94F43a1365bBDe1610D6b61E2B5 地址下lps
    lp =  264078308635359659235
    quantity = 835088935932648266278
    weight = 127614881860929109

    a = ((int(time.time()) - MNT_BEGIN) // 60 - height) * 2 * 10**18
    b = (whole_quantity + a) * weight / whole_weight - quantity
    print(b / 10**18)


def init2():

    MNT_BEGIN = 1666317582
    height = 2927
    whole_weight = 811540842283913001
    whole_quantity = 5342173260496829271933

    ### 0x87391240190aB94F43a1365bBDe1610D6b61E2B5 地址下lps
    lp =  532455532033675865
    quantity = 1683772233983162067
    weight = 683925960422983892
    print("time", time.time())
    currenttime=1666502567
    # a = ((currenttime - MNT_BEGIN) //60.0 - height) * 2 * 10**18
    a = ((int(time.time()) - MNT_BEGIN) //60.0 - height) * 2 * 10**18
    b = (whole_quantity + a) * weight / whole_weight - quantity
    print(b / 10**18)
    print("a",a)

init2()