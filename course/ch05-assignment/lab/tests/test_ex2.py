import random

import numpy as np
import pytest
from scipy.optimize import linear_sum_assignment

from certificate import check_certificate
from labtarget import load
from warehouse import default_costs

ex2 = load("ex2_incremental")


def opt_of(C, cols):
    S = np.asarray(C)[:, cols]
    r, c = linear_sum_assignment(S)
    return float(S[r, c].sum())


def test_golden_trace_default_scenario():
    """页面图 5-2 里看到的过程：T5 到达时扫描 V5, V4, V2, V3, V1，改派链长度 3。"""
    C = default_costs()
    A = ex2.IncrementalAssignment(C)
    marg = []
    for j in range(5):
        ins = A.insert(j)
        marg.append(ins.marginal)
        last = ins
    assert marg == [6, 23, 32, 9, 54]
    assert last.scan_order == [4, 3, 1, 2, 0]
    assert last.radius == [0, 20, 38, 42, 44]
    assert last.D == 44 and last.u0 == 10
    assert last.chain == [(4, None, 4), (1, 4, 1), (2, 1, 0)]
    assert [float(x) for x in A.u] == [8, 67, 38, 33, 54]
    assert [float(x) for x in A.v] == [0, 6, 2, 24, 44, 0]
    assert A.total() == 124


def test_optimal_after_every_insertion():
    rng = random.Random(7)
    for _ in range(200):
        n = rng.randint(1, 7)
        m = rng.randint(n, n + 3)
        C = np.array([[rng.randint(0, 40) for _ in range(n)] for _ in range(m)], float)
        order = list(range(n))
        rng.shuffle(order)
        A = ex2.IncrementalAssignment(C)
        for k, j in enumerate(order):
            A.insert(j)
            assert abs(A.total() - opt_of(C, order[:k + 1])) < 1e-9


def test_invariants_after_every_insertion():
    rng = random.Random(11)
    for _ in range(120):
        n = rng.randint(1, 6)
        m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(0, 30) for _ in range(n)] for _ in range(m)], float)
        order = list(range(n))
        rng.shuffle(order)
        A = ex2.IncrementalAssignment(C)
        for k, j in enumerate(order):
            A.insert(j)
            cols = order[:k + 1]
            Csub = C[:, cols]
            a = [A.vehicle_of[jj] for jj in cols]
            u = [A.u[jj] for jj in cols]
            assert check_certificate(Csub, a, u, A.v) == [], f"证书不成立：order={order[:k + 1]}"


def test_marginal_equals_new_task_price():
    rng = random.Random(5)
    for _ in range(100):
        n = rng.randint(1, 6)
        m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(1, 50) for _ in range(n)] for _ in range(m)], float)
        A = ex2.IncrementalAssignment(C)
        prev = 0.0
        for j in range(n):
            ins = A.insert(j)
            assert abs(ins.marginal - A.u[j]) < 1e-9, "边际成本应等于新任务的最终价格"
            assert abs(ins.marginal - (A.total() - prev)) < 1e-9
            prev = A.total()


def test_chain_structure():
    rng = random.Random(3)
    for _ in range(100):
        n = rng.randint(2, 6)
        m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(1, 30) for _ in range(n)] for _ in range(m)], float)
        A = ex2.IncrementalAssignment(C)
        for j in range(n):
            free_before = {i for i in range(m) if A.task_of[i] is None}
            old = list(A.vehicle_of)
            ins = A.insert(j)
            assert ins.chain[0][0] == j and ins.chain[0][1] is None
            for t in range(1, len(ins.chain)):
                assert ins.chain[t][1] == ins.chain[t - 1][2], "下一个被改派的任务，原来的车就是上一步拿走的车"
            assert ins.chain[-1][2] in free_before, "链的终点是一辆原来空闲的车"
            moved = {t for t, _, _ in ins.chain}
            for t in range(n):
                if t not in moved and old[t] is not None:
                    assert A.vehicle_of[t] == old[t], "不在链上的任务不动"


def test_scan_bounds():
    rng = random.Random(9)
    for _ in range(60):
        n = rng.randint(1, 7)
        m = rng.randint(n, n + 3)
        C = np.array([[rng.randint(1, 20) for _ in range(n)] for _ in range(m)], float)
        A = ex2.IncrementalAssignment(C)
        for j in range(n):
            s0 = A.scans
            ins = A.insert(j)
            assert 1 <= A.scans - s0 <= m
            assert len(ins.scan_order) == A.scans - s0 == len(ins.radius)


def test_worst_case_product_matrix_scans_quadratic():
    """c_ij = (i+1)(j+1)：每次插入几乎扫描全部已有的车，总扫描次数恰好是 n(n+1)/2（按“d 相同取编号小的”）。"""
    for n in (10, 20, 30):
        C = np.array([[(i + 1) * (j + 1) for j in range(n)] for i in range(n)], float)
        A = ex2.IncrementalAssignment(C)
        for j in range(n):
            A.insert(j)
        assert A.scans == n * (n + 1) // 2
