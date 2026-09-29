"""挑战参考答案。"""
import numpy as np
from scipy.optimize import linear_sum_assignment


def _L(C, e1, e2, lam):
    P = np.array(C, float)
    P[e1] += lam
    P[e2] += lam
    r, c = linear_sum_assignment(P)
    both = int(any(i == e1[0] and j == e1[1] for i, j in zip(r, c))) + int(any(i == e2[0] and j == e2[1] for i, j in zip(r, c)))
    return float(P[r, c].sum() - lam), both


def conflict_bound(C, e1, e2):
    C = np.asarray(C, float)
    lo, hi = 0.0, float(C.max()) * C.shape[1] + 1.0
    # L 的斜率 = (最优派法里出现的冲突边条数) - 1：2 条 -> +1（要加大 λ），0 条 -> -1（要减小 λ）
    for _ in range(200):
        mid = (lo + hi) / 2
        _, both = _L(C, e1, e2, mid)
        if both >= 2:
            lo = mid
        elif both == 0:
            hi = mid
        else:
            lo = hi = mid
            break
    lam = (lo + hi) / 2
    return lam, _L(C, e1, e2, lam)[0]
