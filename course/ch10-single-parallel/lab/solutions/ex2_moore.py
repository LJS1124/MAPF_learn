"""练习 2 参考答案"""


def moore_hodgson(p, d):
    order = sorted(range(len(p)), key=lambda j: (d[j], j))
    on, late, t = [], [], 0
    for j in order:
        on.append(j)
        t += p[j]
        if t > d[j]:
            big = max(on, key=lambda x: (p[x], -x))     # 最长的；并列取编号小的
            # max 取 (p, -x) 最大：p 相同时 −x 大的即编号小的
            on.remove(big)
            t -= p[big]
            late.append(big)
    return on + late, len(late)
