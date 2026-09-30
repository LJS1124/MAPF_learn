"""本章的实例与生成器。点 0 是仓库，距离是取整的欧氏距离。

TSP：页面图 8-1 到 8-3、8-5 用的例子（仓库 + 8 个货位）。
CVRP：同一组点，加上每个货位的托盘数 dem[0..7]（对应点 1..8）、每辆车的载重 Q、车数 K。
"""
import math
import random

TSP = {"P": [(76, 49), (91, 54), (50, 56), (17, 46), (12, 4), (17, 63), (27, 33), (86, 55), (99, 38)]}
CVRP = {"P": TSP["P"], "dem": [2, 2, 2, 2, 4, 5, 3, 2], "Q": 9, "K": 3}


def dist(P):
    n = len(P)
    return [[0 if i == j else round(math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1])) for j in range(n)] for i in range(n)]


def random_points(rng, n=8):
    return [(rng.randint(0, 100), rng.randint(0, 70)) for _ in range(n + 1)]
