"""练习 3 参考答案"""
import numpy as np
from scipy.optimize import linprog


def mtz_lp(D):
    n = len(D)
    idx = {}
    for i in range(n):
        for j in range(n):
            if i != j:
                idx[(i, j)] = len(idx)
    nx = len(idx)
    Aeq = np.zeros((2 * n, nx + n))
    for (i, j), k in idx.items():
        Aeq[i, k] = 1
        Aeq[n + j, k] = 1
    A, b = [], []
    for (i, j), k in idx.items():
        if i >= 1 and j >= 1:
            r = np.zeros(nx + n)
            r[k] = n - 1
            r[nx + i] = 1
            r[nx + j] = -1
            A.append(r)
            b.append(n - 2)
    c = np.concatenate([[D[i][j] for (i, j) in idx], np.zeros(n)])
    res = linprog(c, A_ub=np.array(A), b_ub=b, A_eq=Aeq, b_eq=np.ones(2 * n), bounds=[(0, 1)] * nx + [(0, n - 2)] * n, method="highs")
    return float(res.fun)
