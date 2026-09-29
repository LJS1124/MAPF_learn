"""练习 1 用的约束矩阵：3 个任务 × 3 辆车的指派约束，以及加了一行之后的各种变体。

列按 (车 i, 任务 j) 排列，i 优先：列号 k = i * 3 + j。
行：先是 3 行“任务恰好一辆车”，再是 3 行“车至多一个任务”，最后是附加行。
"""
from __future__ import annotations

import numpy as np

M = N = 3


def assignment_matrix(m: int = M, n: int = N) -> np.ndarray:
    A = np.zeros((n + m, m * n), dtype=int)
    for i in range(m):
        for j in range(n):
            A[j, i * n + j] = 1        # 任务行
            A[n + i, i * n + j] = 1    # 车行
    return A


def _veh_row(vehicles, m=M, n=N) -> np.ndarray:
    r = np.zeros(m * n, dtype=int)
    for i in vehicles:
        r[i * n:(i + 1) * n] = 1
    return r


def _edge_row(edges, m=M, n=N) -> np.ndarray:
    r = np.zeros(m * n, dtype=int)
    for i, j in edges:
        r[i * n + j] = 1
    return r


def with_rows(*rows) -> np.ndarray:
    return np.vstack([assignment_matrix(), *rows])


BASE = assignment_matrix()

FAMILIES = {
    # 一组车合计至多接 1 个任务（V1 + V2 ≤ 1）
    "共享名额": with_rows(_veh_row([0, 1])),
    # 两组车有重叠：V1 + V2 ≤ 1 且 V2 + V3 ≤ 1
    "两个重叠名额": with_rows(_veh_row([0, 1]), _veh_row([1, 2])),
    # 路线冲突：V1→T1 与 V2→T2 不能同时出现
    "冲突对": with_rows(_edge_row([(0, 0), (1, 1)])),
    # 同一辆车的两条边不能同时出现（V1→T1 与 V1→T2）
    "同车冲突": with_rows(_edge_row([(0, 0), (0, 1)])),
    # 三条互不相干的边至多出现一条
    "三条边冲突": with_rows(_edge_row([(0, 0), (1, 1), (2, 2)])),
    # 三辆车两两组队的顶点-边关联矩阵（三角形，一般图）
    "奇圈": np.array([[1, 0, 1], [1, 1, 0], [0, 1, 1]]),
}

# 参考答案：True = 全单模
EXPECTED_TU = {
    "共享名额": True,
    "两个重叠名额": False,
    "冲突对": False,
    "同车冲突": True,
    "三条边冲突": False,
    "奇圈": False,
}
