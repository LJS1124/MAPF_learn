"""判分用的暴力枚举基准。只在小规模（m, n <= 6）上用，不依赖任何求解器。

约定：C[i][j] = 车 i 到任务 j 的代价（m 行车，n 列任务）；派法 a 是长度 n 的元组，a[j] = 任务 j 的车。
"""
from __future__ import annotations

import itertools
from typing import Iterable, List, Optional, Sequence, Set, Tuple

import numpy as np

INF = float("inf")


def all_assignments(m: int, n: int) -> Iterable[Tuple[int, ...]]:
    return itertools.permutations(range(m), n)


def total(C, a: Sequence[int]) -> float:
    return float(sum(C[i][j] for j, i in enumerate(a)))


def max_cost(C, a: Sequence[int]) -> float:
    return float(max(C[i][j] for j, i in enumerate(a)))


def _ok(allowed, a) -> bool:
    return allowed is None or all(allowed[i][j] for j, i in enumerate(a))


def opt_total(C, allowed=None) -> Tuple[float, Optional[Tuple[int, ...]]]:
    """总时间最小的派法；没有可行派法时返回 (inf, None)。"""
    m, n = np.shape(C)
    best, arg = INF, None
    for a in all_assignments(m, n):
        if not _ok(allowed, a):
            continue
        t = total(C, a)
        if t < best - 1e-9:
            best, arg = t, a
    return best, arg


def opt_with_deferral(C, allowed=None, penalty=None) -> Tuple[float, Optional[List[Optional[int]]]]:
    """每个任务要么派给一辆不同的允许的车，要么延后并付罚金。penalty=None 表示不允许延后。"""
    C = np.asarray(C, float)
    m, n = C.shape
    if penalty is None:
        t, a = opt_total(C, allowed)
        return t, (list(a) if a is not None else None)
    pen = np.broadcast_to(np.asarray(penalty, float), (n,))
    best, arg = INF, None
    for k in range(n + 1):
        for served in itertools.combinations(range(n), k):
            rest = sum(pen[j] for j in range(n) if j not in served)
            for veh in itertools.permutations(range(m), k):
                if allowed is not None and not all(allowed[i][j] for i, j in zip(veh, served)):
                    continue
                t = rest + sum(C[i][j] for i, j in zip(veh, served))
                if t < best - 1e-9:
                    best = t
                    arg = [None] * n
                    for i, j in zip(veh, served):
                        arg[j] = i
    return best, arg


def opt_bottleneck(C) -> Tuple[float, Optional[Tuple[int, ...]]]:
    m, n = np.shape(C)
    best, arg = INF, None
    for a in all_assignments(m, n):
        t = max_cost(C, a)
        if t < best - 1e-9:
            best, arg = t, a
    return best, arg


def opt_lexicographic(C) -> Tuple[float, float, Optional[Tuple[int, ...]]]:
    """先最晚到达最小，并列时总时间最小。"""
    m, n = np.shape(C)
    bm, bt, arg = INF, INF, None
    for a in all_assignments(m, n):
        mx, tt = max_cost(C, a), total(C, a)
        if mx < bm - 1e-9 or (abs(mx - bm) <= 1e-9 and tt < bt - 1e-9):
            bm, bt, arg = mx, tt, a
    return bm, bt, arg


def pareto_front(C) -> List[Tuple[float, float]]:
    """(最晚到达, 总时间) 的非支配点，按最晚到达递增排列，总时间严格递减。"""
    m, n = np.shape(C)
    pts = {(max_cost(C, a), total(C, a)) for a in all_assignments(m, n)}
    front, best = [], INF
    for mx, tt in sorted(pts):
        if tt < best - 1e-9:
            front.append((mx, tt))
            best = tt
    return front


def hall_violation_ok(allowed, S: Set[int], N: Set[int]) -> bool:
    """验证 (S, N) 是不是一个合法的 Hall 证书：S 是任务集合，N 包含 S 里所有任务的全部可用车，且 |N| < |S|。"""
    allowed = np.asarray(allowed, bool)
    m, _ = allowed.shape
    if not S or len(N) >= len(S):
        return False
    neigh = {i for j in S for i in range(m) if allowed[i][j]}
    return neigh <= set(N)


def is_feasible(allowed, m: int, n: int) -> bool:
    for a in all_assignments(m, n):
        if _ok(allowed, a):
            return True
    return False
