"""练习 2 参考答案"""
import numpy as np
from scipy.optimize import linprog

from helpers import maxflow_to


def separate_sec(x, eps=1e-6):
    n = len(x)
    out, seen = [], set()
    for t in range(1, n):
        f, side = maxflow_to([list(map(float, row)) for row in x], 0, t)
        if f < 1 - eps:
            S = tuple(v for v in side if v != 0)
            if len(S) >= 2 and S not in seen:
                seen.add(S)
                out.append(list(S))
    return sorted(out, key=lambda s: (len(s), s))


def lp_value(D, secs):
    n = len(D)
    idx = {}
    for i in range(n):
        for j in range(n):
            if i != j:
                idx[(i, j)] = len(idx)
    Aeq = np.zeros((2 * n, len(idx)))
    for (i, j), k in idx.items():
        Aeq[i, k] = 1
        Aeq[n + j, k] = 1
    A, b = [], []
    for S in secs:
        r = np.zeros(len(idx))
        for i in S:
            for j in S:
                if i != j:
                    r[idx[(i, j)]] = 1
        A.append(r)
        b.append(len(S) - 1)
    res = linprog([D[i][j] for (i, j) in idx], A_ub=np.array(A) if A else None, b_ub=b or None, A_eq=Aeq, b_eq=np.ones(2 * n), bounds=(0, 1), method="highs")
    x = np.zeros((n, n))
    for (i, j), k in idx.items():
        x[i, j] = res.x[k]
    return float(res.fun), x


def cut_loop(D, max_rounds=30):
    secs, rounds = [], []
    for _ in range(max_rounds):
        val, x = lp_value(D, secs)
        rounds.append(val)
        new = [S for S in separate_sec(x) if S not in secs]
        if not new:
            break
        secs += new
    return {"rounds": rounds, "secs": secs, "final": rounds[-1]}
