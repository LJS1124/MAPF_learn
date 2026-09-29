"""最优性证书检查（第 2 章的五项检查），不依赖任何求解器。

记号：C[i][j] 车 i 到任务 j 的代价；u[j] 任务价格（不限符号）；v[i] 车价格（>= 0）。
约化成本 r_ij = C[i][j] + v[i] - u[j]。
"""
from __future__ import annotations

from typing import List, Sequence

import numpy as np


def check_certificate(C, a: Sequence[int], u: Sequence[float], v: Sequence[float], tol: float = 1e-7) -> List[str]:
    """返回问题代码列表，空列表 = 证书成立，派法一定最优。

    PRIMAL_INFEASIBLE     派法不合法（下标越界、两个任务用同一辆车）
    NEGATIVE_VEHICLE_PRICE  有车价为负
    DUAL_INFEASIBLE       有一对 (i, j) 的约化成本为负
    NOT_TIGHT             被选中的边不紧
    IDLE_VEHICLE_PRICED   没被用到的车价格不为 0
    DUALITY_GAP           派法总时间 != sum(u) - sum(v)
    """
    C = np.asarray(C, float)
    m, n = C.shape
    issues: List[str] = []
    a = list(a)
    if len(a) != n or any((not isinstance(i, (int, np.integer))) or i < 0 or i >= m for i in a) or len(set(a)) != n:
        return ["PRIMAL_INFEASIBLE"]
    u = np.asarray(u, float)
    v = np.asarray(v, float)
    if (v < -tol).any():
        issues.append("NEGATIVE_VEHICLE_PRICE")
    r = C + v[:, None] - u[None, :]
    if (r < -tol).any():
        issues.append("DUAL_INFEASIBLE")
    if any(abs(r[i][j]) > tol for j, i in enumerate(a)):
        issues.append("NOT_TIGHT")
    used = set(a)
    if any(i not in used and v[i] > tol for i in range(m)):
        issues.append("IDLE_VEHICLE_PRICED")
    primal = sum(C[i][j] for j, i in enumerate(a))
    if abs(primal - (u.sum() - v.sum())) > 1e-6:
        issues.append("DUALITY_GAP")
    return issues
