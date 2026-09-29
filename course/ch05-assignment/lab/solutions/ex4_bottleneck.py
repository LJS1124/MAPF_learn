"""练习 4 参考答案。"""
import numpy as np
from scipy.sparse import csr_matrix
from scipy.sparse.csgraph import maximum_bipartite_matching

from solutions.ex3_dispatch import dispatch


def _matching(C, tau):
    """只保留 C <= tau 的边，返回 (是否每个任务都配上, task -> vehicle 或 -1)。"""
    C = np.asarray(C, float)
    m, n = C.shape
    biadj = csr_matrix((C <= tau).T.astype(np.int8))          # 行 = 任务，列 = 车
    mt = maximum_bipartite_matching(biadj, perm_type="column")  # 每个任务匹配到的车，-1 = 没配上
    return bool((mt >= 0).all()), [int(x) for x in mt]


def bottleneck(C):
    C = np.asarray(C, float)
    vals = np.unique(C)
    lo, hi = 0, len(vals) - 1
    ok, _ = _matching(C, vals[hi])
    if not ok:
        return None
    while lo < hi:
        mid = (lo + hi) // 2
        if _matching(C, vals[mid])[0]:
            hi = mid
        else:
            lo = mid + 1
    return float(vals[lo]), _matching(C, vals[lo])[1]


def lexicographic(C):
    C = np.asarray(C, float)
    tau, _ = bottleneck(C)
    res = dispatch(C, allowed=(C <= tau))
    return tau, float(res.total), list(res.assign)


def pareto(C):
    C = np.asarray(C, float)
    tau0, _ = bottleneck(C)
    front, best = [], float("inf")
    for tau in np.unique(C):
        if tau < tau0:
            continue
        res = dispatch(C, allowed=(C <= tau))
        if res.feasible and res.total < best - 1e-9:
            best = res.total
            mx = max(C[i][j] for j, i in enumerate(res.assign))
            front.append((float(mx), float(res.total)))
    return front
