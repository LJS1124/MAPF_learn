"""挑战参考答案"""


def p2_opt(p):
    tot = sum(p)
    half = tot // 2
    reach = [False] * (half + 1)
    reach[0] = True
    for x in p:
        for s in range(half, x - 1, -1):
            if reach[s - x]:
                reach[s] = True
    s = max(i for i in range(half + 1) if reach[i])
    return tot - s
