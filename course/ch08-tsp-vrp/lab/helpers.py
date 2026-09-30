"""练习 2 可以直接用的工具（不要修改）：最大流。"""
from collections import deque


def maxflow_to(cap, s, t, eps=1e-9):
    """cap 是 n×n 的容量矩阵。返回 (最大流量, 汇侧点集)：
    汇侧点集 = 在最终残量图里能到达 t 的点（最小的汇侧最小割）。"""
    n = len(cap)
    r = [row[:] for row in cap]
    flow = 0.0
    while True:
        par = [-1] * n
        par[s] = s
        q = deque([s])
        while q and par[t] < 0:
            u = q.popleft()
            for v in range(n):
                if par[v] < 0 and r[u][v] > eps:
                    par[v] = u
                    q.append(v)
        if par[t] < 0:
            break
        b, x = float("inf"), t
        while x != s:
            b = min(b, r[par[x]][x])
            x = par[x]
        x = t
        while x != s:
            r[par[x]][x] -= b
            r[x][par[x]] += b
            x = par[x]
        flow += b
    reach = {t}
    stack = [t]
    while stack:
        y = stack.pop()
        for u in range(n):
            if u not in reach and r[u][y] > eps:
                reach.add(u)
                stack.append(u)
    return flow, sorted(reach)
