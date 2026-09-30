"""判分用的独立参考实现：暴力枚举和 linprog，不依赖学生的代码。"""
import itertools

import numpy as np
from scipy.optimize import linprog


def knap_brute(v, w, cap):
    n = len(v)
    best = (0, [0] * n)
    for mask in range(1 << n):
        take = [(mask >> j) & 1 for j in range(n)]
        if sum(w[j] for j in range(n) if take[j]) <= cap:
            val = sum(v[j] for j in range(n) if take[j])
            if val > best[0]:
                best = (val, take)
    return best


def knap_lp_ref(v, w, cap):
    res = linprog([-a for a in v], A_ub=[w], b_ub=[cap], bounds=[(0, 1)] * len(v), method="highs")
    return -res.fun


def gap_check(C, w, Q, assign):
    """返回 (合法, 总费用)：每个任务恰有一辆车，且每辆车的载重不超。"""
    m, n = len(C), len(w)
    if len(assign) != n or any(a is None or not (0 <= a < m) for a in assign):
        return False, None
    load = [0] * m
    for j, a in enumerate(assign):
        load[a] += w[j]
    if any(load[i] > Q[i] for i in range(m)):
        return False, None
    return True, sum(C[a][j] for j, a in enumerate(assign))


def gap_ip(C, w, Q):
    """枚举求最优。返回 (值, 派法)；无解 (None, None)。"""
    m, n = len(C), len(w)
    best = [None, None]
    load = [0] * m
    cur = [-1] * n

    def go(j, cost):
        if j == n:
            if best[0] is None or cost < best[0]:
                best[0], best[1] = cost, cur[:]
            return
        for i in range(m):
            if load[i] + w[j] <= Q[i]:
                load[i] += w[j]
                cur[j] = i
                go(j + 1, cost + C[i][j])
                load[i] -= w[j]
                cur[j] = -1
    go(0, 0)
    return best[0], best[1]


def gap_feasible_assignments(C, w, Q):
    m, n = len(C), len(w)
    for a in itertools.product(range(m), repeat=n):
        if gap_check(C, w, Q, list(a))[0]:
            yield a


def gap_lp_ref(C, w, Q, cuts=()):
    """GAP 的 LP 松弛（可带覆盖割 (i, S, k)）。无解返回 None。"""
    m, n = len(C), len(w)
    Aeq = np.zeros((n, m * n))
    for j in range(n):
        for i in range(m):
            Aeq[j, i * n + j] = 1
    A, b = [], []
    for i in range(m):
        r = np.zeros(m * n)
        r[i * n:(i + 1) * n] = w
        A.append(r)
        b.append(Q[i])
    for (i, S, k) in cuts:
        r = np.zeros(m * n)
        for j in S:
            r[i * n + j] = 1
        A.append(r)
        b.append(k)
    res = linprog(np.array(C, float).ravel(), A_ub=np.array(A), b_ub=b, A_eq=Aeq, b_eq=np.ones(n), bounds=(0, 1), method="highs")
    return (res.fun, res.x.reshape(m, n)) if res.status == 0 else None


def bin_opt(w, Q):
    """最少车次（回溯，n <= 12）。装不下的托盘返回 None。"""
    if any(x > Q for x in w):
        return None
    order = sorted(range(len(w)), key=lambda j: -w[j])
    best = [len(w)]
    loads = []

    def go(k):
        if len(loads) >= best[0]:
            return
        if k == len(order):
            best[0] = len(loads)
            return
        j = order[k]
        for b in range(len(loads)):
            if loads[b] + w[j] <= Q:
                loads[b] += w[j]
                go(k + 1)
                loads[b] -= w[j]
        loads.append(w[j])
        go(k + 1)
        loads.pop()
    go(0)
    return best[0]
