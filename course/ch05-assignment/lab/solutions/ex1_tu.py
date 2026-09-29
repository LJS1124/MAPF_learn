"""练习 1 参考答案。"""
import itertools

import numpy as np

PREDICTION = {
    "共享名额": "TU",
    "两个重叠名额": "NOT_TU",
    "冲突对": "NOT_TU",
    "同车冲突": "TU",
    "三条边冲突": "NOT_TU",
    "奇圈": "NOT_TU",
}


def _det(B) -> int:
    return int(round(np.linalg.det(B)))


def submatrix_dets(A):
    A = np.asarray(A)
    R, C = A.shape
    hist = {}
    for k in range(1, min(R, C) + 1):
        col_sets = list(itertools.combinations(range(C), k))
        for rows in itertools.combinations(range(R), k):
            sub = A[list(rows)]
            for cols in col_sets:
                d = _det(sub[:, list(cols)])
                hist[d] = hist.get(d, 0) + 1
    return hist


def find_violation(A):
    A = np.asarray(A)
    R, C = A.shape
    for k in range(1, min(R, C) + 1):
        col_sets = list(itertools.combinations(range(C), k))
        for rows in itertools.combinations(range(R), k):
            sub = A[list(rows)]
            for cols in col_sets:
                d = _det(sub[:, list(cols)])
                if abs(d) >= 2:
                    return rows, cols, d
    return None


def is_tu(A):
    return find_violation(A) is None
