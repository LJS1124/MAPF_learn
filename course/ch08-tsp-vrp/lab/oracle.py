"""判分用的独立参考实现：暴力枚举、完整的子回路约束 LP、CVRP 暴力。"""
import itertools

import numpy as np
from scipy.optimize import linprog


def tour_length(D, tour):
    return sum(D[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))


def tsp_brute(D):
    n = len(D)
    if n <= 1:
        return 0
    return min(tour_length(D, [0] + list(p)) for p in itertools.permutations(range(1, n)))


def _arcs(n):
    idx = {}
    for i in range(n):
        for j in range(n):
            if i != j:
                idx[(i, j)] = len(idx)
    return idx


def lp_with_secs(D, secs):
    n = len(D)
    idx = _arcs(n)
    nv = len(idx)
    Aeq = np.zeros((2 * n, nv))
    for (i, j), k in idx.items():
        Aeq[i, k] = 1
        Aeq[n + j, k] = 1
    A, b = [], []
    for S in secs:
        r = np.zeros(nv)
        for i in S:
            for j in S:
                if i != j:
                    r[idx[(i, j)]] = 1
        A.append(r)
        b.append(len(S) - 1)
    c = np.array([D[i][j] for (i, j) in idx])
    res = linprog(c, A_ub=np.array(A) if A else None, b_ub=b or None, A_eq=Aeq, b_eq=np.ones(2 * n), bounds=(0, 1), method="highs")
    x = np.zeros((n, n))
    for (i, j), k in idx.items():
        x[i, j] = res.x[k]
    return res.fun, x


def full_sec_lp(D):
    """加入全部子回路约束（S ⊆ {1..n-1}，|S| >= 2）后的 LP 值：子回路下界。"""
    n = len(D)
    secs = [S for k in range(2, n) for S in itertools.combinations(range(1, n), k)]
    return lp_with_secs(D, secs)[0]


def mtz_lp_ref(D):
    n = len(D)
    idx = _arcs(n)
    nx = len(idx)
    nv = nx + n
    Aeq = np.zeros((2 * n, nv))
    for (i, j), k in idx.items():
        Aeq[i, k] = 1
        Aeq[n + j, k] = 1
    A, b = [], []
    for (i, j), k in idx.items():
        if i >= 1 and j >= 1:
            r = np.zeros(nv)
            r[k] = n - 1
            r[nx + i] = 1
            r[nx + j] = -1
            A.append(r)
            b.append(n - 2)
    c = np.concatenate([[D[i][j] for (i, j) in idx], np.zeros(n)])
    res = linprog(c, A_ub=np.array(A), b_ub=b, A_eq=Aeq, b_eq=np.ones(2 * n), bounds=[(0, 1)] * nx + [(0, n - 2)] * n, method="highs")
    return res.fun


def cvrp_brute(D, dem, Q, K):
    """把客户分成至多 K 组（每组需求不超 Q），每组取最短路线。m <= 7。"""
    m = len(dem)
    best = [None]

    def route_cost(group):
        if not group:
            return 0
        return min(tour_length(D, [0] + list(p)) for p in itertools.permutations(group))

    def go(i, groups):
        if i == m:
            c = sum(route_cost(g) for g in groups)
            if best[0] is None or c < best[0]:
                best[0] = c
            return
        for g in groups:
            if sum(dem[c - 1] for c in g) + dem[i] <= Q:
                g.append(i + 1)
                go(i + 1, groups)
                g.pop()
        if len(groups) < K and dem[i] <= Q:
            groups.append([i + 1])
            go(i + 1, groups)
            groups.pop()
    go(0, [])
    return best[0]
