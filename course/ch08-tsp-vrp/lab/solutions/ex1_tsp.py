"""练习 1 参考答案"""
import numpy as np
from scipy.optimize import linear_sum_assignment


def held_karp(D):
    n = len(D)
    if n == 1:
        return 0, [0]
    m = n - 1
    INF = float("inf")
    dp = [[INF] * m for _ in range(1 << m)]
    par = [[-1] * m for _ in range(1 << m)]
    for k in range(m):
        dp[1 << k][k] = D[0][k + 1]
    for mask in range(1, 1 << m):
        for k in range(m):
            if not mask & (1 << k) or dp[mask][k] == INF:
                continue
            for j in range(m):
                if mask & (1 << j):
                    continue
                nm = mask | (1 << j)
                v = dp[mask][k] + D[k + 1][j + 1]
                if v < dp[nm][j]:
                    dp[nm][j] = v
                    par[nm][j] = k
    full = (1 << m) - 1
    best, bk = min((dp[full][k] + D[k + 1][0], k) for k in range(m))
    tour, mask, cur = [], full, bk
    while cur >= 0:
        tour.append(cur + 1)
        pk = par[mask][cur]
        mask ^= 1 << cur
        cur = pk
    return best, [0] + tour[::-1]


def find_subtours(succ):
    """succ[i] 是点 i 的后继；返回回路列表，每个回路从它最小的点开始，回路按最小点排序。"""
    n = len(succ)
    seen = [False] * n
    out = []
    for s in range(n):
        if seen[s]:
            continue
        cyc, v = [], s
        while not seen[v]:
            seen[v] = True
            cyc.append(v)
            v = succ[v]
        out.append(cyc)
    return out


def assignment_relaxation(D):
    """只保留“每个点恰有一条出弧、一条入弧”的松弛：就是第 5 章的指派问题（对角线禁止）。返回 (值, succ)。"""
    n = len(D)
    big = 10 ** 6
    C = np.array(D, float) + big * np.eye(n)
    r, c = linear_sum_assignment(C)
    succ = [0] * n
    for i, j in zip(r, c):
        succ[i] = int(j)
    return float(sum(D[i][succ[i]] for i in range(n))), succ
