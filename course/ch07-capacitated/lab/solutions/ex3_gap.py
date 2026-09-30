"""练习 3 参考答案"""
import numpy as np
from scipy.optimize import linprog


def gap_lp(C, w, Q, cuts=()):
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
    if res.status != 0:
        return None, None
    return float(res.fun), res.x.reshape(m, n)


def gap_enum(C, w, Q):
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
