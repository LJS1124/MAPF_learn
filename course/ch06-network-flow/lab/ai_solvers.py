"""练习 5 的材料：5 个“AI 写的”最大流函数。它们都能跑，多数小例子上结果看起来也对，但每个都有一个问题。

接口都一样：
    fn(n, arcs, s, t) -> {"value": 汇报的流量, "flow": 每条弧上的流量, "cut": 一个最小割的源侧点集（可以是 None）}
    arcs 是 (u, v, cap, cost) 元组的列表（费用在这里用不上）。

请不要修改这个文件。ex5_audit.py 里的 audit 要在不看源码的前提下，只靠运行结果把它们的问题查出来。
"""
from collections import deque


def _residual(n, arcs):
    cap = [0] * (2 * len(arcs))
    adj = [[] for _ in range(n)]
    for k, (u, v, c, _) in enumerate(arcs):
        cap[2 * k] = c
        adj[u].append(2 * k)
        adj[v].append(2 * k + 1)
    return cap, adj


def _head(arcs, a):
    return arcs[a // 2][1] if a % 2 == 0 else arcs[a // 2][0]


def _bfs_path(n, arcs, cap, adj, s, t, forward_only=False):
    par = [-1] * n
    seen = [False] * n
    seen[s] = True
    q = deque([s])
    while q:
        u = q.popleft()
        for a in adj[u]:
            v = _head(arcs, a)
            if forward_only and a % 2 == 1:
                continue
            if cap[a] > 0 and not seen[v]:
                seen[v] = True
                par[v] = a
                q.append(v)
    if not seen[t]:
        return None, seen
    path, v = [], t
    while v != s:
        path.append(par[v])
        v = _head(arcs, par[v] ^ 1)
    return path[::-1], seen


def ai_a(n, arcs, s, t):
    """AI-A：反复找增广路，每次沿路推流。"""
    cap, adj = _residual(n, arcs)
    value = 0
    while True:
        path, seen = _bfs_path(n, arcs, cap, adj, s, t, forward_only=True)
        if path is None:
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
        value += b
    return {"value": value, "flow": [arcs[k][2] - cap[2 * k] for k in range(len(arcs))], "cut": {v for v in range(n) if seen[v]}}


def ai_b(n, arcs, s, t):
    """AI-B：标准的 Edmonds–Karp，最后顺手把最小割也报出来。"""
    cap, adj = _residual(n, arcs)
    value = 0
    while True:
        path, _ = _bfs_path(n, arcs, cap, adj, s, t)
        if path is None:
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
        value += b
    reach, q = {s}, deque([s])
    while q:
        u = q.popleft()
        for k, (a, b, c, _) in enumerate(arcs):
            if a == u and b not in reach and c > 0:
                reach.add(b)
                q.append(b)
    return {"value": value, "flow": [cap[2 * k + 1] for k in range(len(arcs))], "cut": reach}


def ai_c(n, arcs, s, t):
    """AI-C：增广路里如果走到回退弧，就把那条弧上的流量增加相应的量。"""
    cap, adj = _residual(n, arcs)
    flow = [0] * len(arcs)
    value = 0
    while True:
        path, seen = _bfs_path(n, arcs, cap, adj, s, t)
        if path is None:
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
            flow[a // 2] += b
        value += b
    return {"value": value, "flow": flow, "cut": {v for v in range(n) if seen[v]}}


def ai_d(n, arcs, s, t):
    """AI-D：求出最大流，并按“从源点发出的容量”汇报流量，理由是“饱和了才算最大”。"""
    cap, adj = _residual(n, arcs)
    while True:
        path, seen = _bfs_path(n, arcs, cap, adj, s, t)
        if path is None:
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
    return {"value": sum(c for (u, v, c, _) in arcs if u == s), "flow": [cap[2 * k + 1] for k in range(len(arcs))],
            "cut": {v for v in range(n) if seen[v]}}


def ai_e(n, arcs, s, t):
    """AI-E：Edmonds–Karp，代码更短：路径靠 max() 取瓶颈。"""
    cap, adj = _residual(n, arcs)
    value = 0
    while True:
        path, seen = _bfs_path(n, arcs, cap, adj, s, t)
        if path is None:
            if value == 0:
                b = max(cap[a] for a in adj[s])      # 首次就没有路时，顺便取一下源点最大的残量
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
        value += b
    return {"value": value, "flow": [cap[2 * k + 1] for k in range(len(arcs))], "cut": {v for v in range(n) if seen[v]}}


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "NOT_MAX", "AI-B": "BAD_CUT", "AI-C": "VIOLATES_CAP", "AI-D": "WRONG_VALUE", "AI-E": "CRASH"}
