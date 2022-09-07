def A(x,y):
    n = (3 + 1)
    e = 1.25 # 1.125
    return  ((x / y) ** e) * (n * y - 1)

def B(x):
    ret = A(x,1)
    for n in range(2,51):
        ret_new = A(x,n)
        print(ret)
        print(ret_new)
        print("------")
        assert(ret > ret_new)
        ret = ret_new
def C():
    for x in range(51):
        B(10**x)
        B(1.0/(10**x))

C()