import random

import numpy as np

from labtarget import load
from oracle import opt_bottleneck, opt_lexicographic, pareto_front, max_cost, total
from warehouse import default_costs

ex4 = load("ex4_bottleneck")


def random_matrix(rng):
    n = rng.randint(1, 5)
    m = rng.randint(n, n + 2)
    return np.array([[rng.randint(1, 30) for _ in range(n)] for _ in range(m)], float)


def valid(C, assign):
    m, n = C.shape
    assign = list(assign)
    return len(assign) == n and all(0 <= i < m for i in assign) and len(set(assign)) == n


def test_default_scenario_numbers():
    C = default_costs()
    tau, a = ex4.bottleneck(C)
    assert tau == 49 and valid(C, a) and max_cost(C, a) == 49
    tau, tot, a = ex4.lexicographic(C)
    assert (tau, tot) == (49, 146) and valid(C, a) and total(C, a) == 146 and max_cost(C, a) == 49
    assert [(float(x), float(y)) for x, y in ex4.pareto(C)] == [(49, 146), (60, 136), (61, 124)]


def test_bottleneck_vs_bruteforce():
    rng = random.Random(31)
    for _ in range(200):
        C = random_matrix(rng)
        tau, a = ex4.bottleneck(C)
        best, _ = opt_bottleneck(C)
        assert tau == best
        assert valid(C, a) and max_cost(C, a) <= tau


def test_lexicographic_vs_bruteforce():
    rng = random.Random(32)
    for _ in range(200):
        C = random_matrix(rng)
        tau, tot, a = ex4.lexicographic(C)
        bm, bt, _ = opt_lexicographic(C)
        assert (tau, tot) == (bm, bt)
        assert valid(C, a) and max_cost(C, a) <= tau and abs(total(C, a) - tot) < 1e-9


def test_pareto_vs_bruteforce():
    rng = random.Random(33)
    for _ in range(200):
        C = random_matrix(rng)
        got = [(float(x), float(y)) for x, y in ex4.pareto(C)]
        assert got == pareto_front(C)
        assert all(got[k][0] < got[k + 1][0] and got[k][1] > got[k + 1][1] for k in range(len(got) - 1))


def test_tie_at_threshold_uses_less_or_equal():
    """阈值判断用 <=：代价恰好等于 τ 的边也算允许。"""
    C = np.array([[3.0, 9.0], [9.0, 3.0]])
    tau, a = ex4.bottleneck(C)
    assert tau == 3 and list(a) == [0, 1]
