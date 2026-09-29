from math import comb

import numpy as np
import pytest

from families import BASE, EXPECTED_TU, FAMILIES
from labtarget import load

ex1 = load("ex1_tu")

# 由独立实现枚举得到的全部方子式行列式分布（本章页面图 5-4 显示的同一组数字）
EXPECTED_HIST = {
    "基准": (BASE, {0: 3213, 1: 1011, -1: 780}),
    "共享名额": (FAMILIES["共享名额"], {1: 1941, 0: 7728, -1: 1770}),
    "两个重叠名额": (FAMILIES["两个重叠名额"], {1: 3908, 0: 16878, -1: 3499, 2: 20, -2: 4}),
    "冲突对": (FAMILIES["冲突对"], {1: 1857, 0: 7782, -1: 1654, 2: 63, -2: 83}),
    "同车冲突": (FAMILIES["同车冲突"], {1: 1687, 0: 8240, -1: 1512}),
    "三条边冲突": (FAMILIES["三条边冲突"], {1: 2125, 0: 7104, -1: 1808, 2: 193, -2: 191, -3: 12, 3: 6}),
    "奇圈": (FAMILIES["奇圈"], {1: 12, 0: 3, -1: 3, 2: 1}),
}


@pytest.mark.parametrize("name", list(EXPECTED_HIST))
def test_histogram_exact(name):
    A, expect = EXPECTED_HIST[name]
    got = ex1.submatrix_dets(A)
    assert {int(k): int(v) for k, v in got.items()} == expect


def test_histogram_counts_all_submatrices():
    A = FAMILIES["冲突对"]
    R, C = A.shape
    got = ex1.submatrix_dets(A)
    assert sum(got.values()) == sum(comb(R, k) * comb(C, k) for k in range(1, min(R, C) + 1))


def test_base_is_tu():
    assert ex1.find_violation(BASE) is None


@pytest.mark.parametrize("name", list(FAMILIES))
def test_find_violation_matches_truth(name):
    A = FAMILIES[name]
    v = ex1.find_violation(A)
    if EXPECTED_TU[name]:
        assert v is None, f"{name} 是全单模的，不该找到反例：{v}"
        return
    assert v is not None, f"{name} 不是全单模的，应该能找到反例"
    rows, cols, d = v
    assert len(rows) == len(cols) >= 2
    real = int(round(np.linalg.det(A[list(rows)][:, list(cols)])))
    assert real == d and abs(d) >= 2, f"报告的行列式 {d} 与重新计算的 {real} 不符"


def test_smallest_violation_first():
    """按 k 从小到大枚举：三角形的反例就是整个 3×3 矩阵。"""
    rows, cols, d = ex1.find_violation(FAMILIES["奇圈"])
    assert len(rows) == 3 and abs(d) == 2
