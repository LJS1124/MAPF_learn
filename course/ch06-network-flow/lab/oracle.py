"""判分用的独立参考实现：不依赖学生的代码。全部是小规模的暴力或教科书算法。"""
import itertools

import numpy as np
from scipy.optimize import linprog

from network import INF


def floyd(n, arcs):
    """Floyd–Warshall。返回 (dist 矩阵, 是否有负环)。"""
    d = [[INF] * n for _ in range(n)]
    for i in range(n):
        d[i][i] = 0
    for u, v, _, w in arcs:
        d[u][v] = min(d[u][v], w)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if d[i][k] + d[k][j] < d[i][j]:
                    d[i][j] = d[i][k] + d[k][j]
    return d, any(d[i][i] < 0 for i in range(n))


def shortest_dist(n, arcs, s):
    d, neg = floyd(n, arcs)
    return (None if neg else d[s]), neg


def has_neg_cycle(n, arcs):
    return floyd(n, arcs)[1]


def min_cut_value(n, arcs, s, t):
    """枚举所有 s 在 S、t 不在 S 的点集，取最小割容量。返回 (值, S 集合)。"""
    others = [v for v in range(n) if v not in (s, t)]
    best = (INF, None)
    for mask in range(1 << len(others)):
        S = {s} | {others[i] for i in range(len(others)) if mask >> i & 1}
        cap = sum(c for u, v, c, _ in arcs if u in S and v not in S)
        if cap < best[0]:
            best = (cap, S)
    return best


def check_flow(n, arcs, flow, s, t):
    """返回 (合法, 流量值)：容量、非负、除 s,t 外流量守恒。"""
    if len(flow) != len(arcs):
        return False, None
    bal = [0] * n
    for k, (u, v, c, _) in enumerate(arcs):
        x = flow[k]
        if x < -1e-9 or x > c + 1e-9:
            return False, None
        bal[u] -= x
        bal[v] += x
    for v in range(n):
        if v not in (s, t) and abs(bal[v]) > 1e-9:
            return False, None
    return True, bal[t]


def min_cost_lp(n, arcs, s, t, k):
    """min-cost flow 值为 k 的 LP（弧-点关联矩阵全单模，所以 LP 值 = 整数最优）。无解返回 None。"""
    m = len(arcs)
    A = np.zeros((n, m))
    for e, (u, v, _, _) in enumerate(arcs):
        A[u, e] += 1
        A[v, e] -= 1
    b = np.zeros(n)
    b[s], b[t] = k, -k
    res = linprog([a[3] for a in arcs], A_eq=A, b_eq=b,
                  bounds=[(0, a[2]) for a in arcs], method="highs")
    return round(res.fun) if res.status == 0 else None


def max_flow_value(n, arcs, s, t):
    return min_cut_value(n, arcs, s, t)[0]


def certificate_ok(n, arcs, flow, pi):
    """最优性证书：残量图里每条弧的约化成本 cost + pi[u] − pi[v] >= 0。"""
    for k, (u, v, c, w) in enumerate(arcs):
        if flow[k] < c and w + pi[u] - pi[v] < -1e-9:
            return False
        if flow[k] > 0 and -w + pi[v] - pi[u] < -1e-9:
            return False
    return True


def some_max_flow(n, arcs, s, t):
    """任意一个最大流（不看费用），给挑战的循环取消当起点。返回每条弧上的流量。"""
    from collections import deque
    m = len(arcs)
    cap = [0] * (2 * m)
    adj = [[] for _ in range(n)]
    for k, (u, v, c, _) in enumerate(arcs):
        cap[2 * k] = c
        adj[u].append(2 * k)
        adj[v].append(2 * k + 1)
    head = lambda a: arcs[a // 2][1] if a % 2 == 0 else arcs[a // 2][0]
    while True:
        par = [-1] * n
        seen = [False] * n
        seen[s] = True
        q = deque([s])
        while q:
            u = q.popleft()
            for a in adj[u]:
                if cap[a] > 0 and not seen[head(a)]:
                    seen[head(a)] = True
                    par[head(a)] = a
                    q.append(head(a))
        if not seen[t]:
            break
        path, v = [], t
        while v != s:
            path.append(par[v])
            v = head(par[v] ^ 1)
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
    return [cap[2 * k + 1] for k in range(m)]


def node_cap_max_flow(n, arcs, s, t, node_cap):
    """带点容量的最大流：用 LP（点入流量 <= 容量）；结果是整数。"""
    m = len(arcs)
    A_eq, b_eq, A_ub, b_ub = [], [], [], []
    for v in range(n):
        row = np.zeros(m + 1)
        for e, (a, b, _, _) in enumerate(arcs):
            if a == v:
                row[e] += 1
            if b == v:
                row[e] -= 1
        if v == s:
            row[m] = 1          # 变量 m = 总流量：流出 s 的净量
            row = -row
            row[m] = 1
        if v == t:
            row[m] = 1
        if v not in (s, t):
            A_eq.append(row)
            b_eq.append(0)
        elif v == s:
            A_eq.append(row)
            b_eq.append(0)
    for v, c in node_cap.items():
        row = np.zeros(m + 1)
        for e, (a, b, _, _) in enumerate(arcs):
            if b == v:
                row[e] = 1
        if v == s:
            for e, (a, b, _, _) in enumerate(arcs):
                if a == v:
                    row[e] = 1
        A_ub.append(row)
        b_ub.append(c)
    obj = np.zeros(m + 1)
    obj[m] = -1
    res = linprog(obj, A_ub=np.array(A_ub) if A_ub else None, b_ub=b_ub or None, A_eq=np.array(A_eq), b_eq=b_eq,
                  bounds=[(0, a[2]) for a in arcs] + [(0, None)], method="highs")
    return round(-res.fun)
