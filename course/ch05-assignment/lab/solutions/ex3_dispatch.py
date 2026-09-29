"""练习 3 参考答案。"""
from dataclasses import dataclass
from typing import List, Optional, Tuple

import numpy as np
from scipy.optimize import linear_sum_assignment


@dataclass
class Result:
    feasible: bool
    assign: List[Optional[int]]
    total: float
    deferred: List[int]
    hall: Optional[Tuple[frozenset, frozenset]]


def _match_tasks(allowed):
    """Kuhn 增广：让每个任务配一辆不同的允许的车。返回 (task -> vehicle, vehicle -> task)。"""
    m, n = allowed.shape
    mt = [-1] * n
    mv = [-1] * m

    def aug(j, seen):
        for i in range(m):
            if allowed[i][j] and i not in seen:
                seen.add(i)
                if mv[i] == -1 or aug(mv[i], seen):
                    mv[i] = j
                    mt[j] = i
                    return True
        return False

    for j in range(n):
        aug(j, set())
    return mt, mv


def hall_certificate(allowed):
    """没有完美匹配时，返回 (S, N)：|N| < |S|，N 包含 S 里所有任务的全部可用车。"""
    allowed = np.asarray(allowed, bool)
    m, n = allowed.shape
    mt, mv = _match_tasks(allowed)
    if -1 not in mt:
        return None
    j0 = mt.index(-1)
    S, N = {j0}, set()
    queue = [j0]
    while queue:
        j = queue.pop()
        for i in range(m):
            if allowed[i][j] and i not in N:
                N.add(i)
                jn = mv[i]
                if jn != -1 and jn not in S:
                    S.add(jn)
                    queue.append(jn)
    return frozenset(S), frozenset(N)


def dispatch(C, allowed=None, penalty=None) -> Result:
    C = np.asarray(C, dtype=float)
    m, n = C.shape
    allowed = np.ones((m, n), bool) if allowed is None else np.asarray(allowed, bool)
    pen = None if penalty is None else np.broadcast_to(np.asarray(penalty, float), (n,)).copy()

    finite = C[allowed]
    mx = float(finite.max()) if finite.size else 0.0
    if pen is not None:
        mx = max(mx, float(pen.max()))
    M = 1.0 + n * mx                 # 任何用到禁行边的派法 >= M > 任何合法派法（<= n * mx）
    P = np.where(allowed, C, M)
    if pen is not None:
        P = np.vstack([P, np.tile(pen, (n, 1))])   # n 辆虚拟车：谁去都行，代价 = 该任务的罚金
    infeasible = Result(False, [None] * n, float("inf"), [], hall_certificate(allowed))
    if P.shape[0] < n:
        return infeasible
    rows, cols = linear_sum_assignment(P)
    assign: List[Optional[int]] = [None] * n
    deferred: List[int] = []
    total = 0.0
    for i, j in zip(rows, cols):
        if i >= m:                                    # 落在虚拟车上：延后
            deferred.append(int(j))
            total += float(pen[j])
        elif not allowed[i][j]:                       # 用到了禁行边：无解
            return infeasible
        else:
            assign[j] = int(i)
            total += float(C[i][j])
    return Result(True, assign, total, sorted(deferred), None)
