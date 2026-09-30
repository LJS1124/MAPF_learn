import random

import pytest

from instances import JOB, R
from labtarget import load
from oracle import opt_cmax as ref_opt

ex2 = load("ex2_parallel")
IDENT = [JOB["p"], JOB["p"]]


def test_page_examples():
    order = list(range(6))
    assert ex2.list_schedule(IDENT, order)[0] == 16
    assert ex2.opt_cmax(IDENT)[0] == 15
    lpt = sorted(range(6), key=lambda j: (-JOB["p"][j], j))
    assert ex2.list_schedule(IDENT, lpt)[0] == 15
    assert ex2.list_schedule(R, order)[0] == 11 and ex2.opt_cmax(R)[0] == 11
    assert ex2.list_schedule(R, lpt)[0] == 14


def test_list_schedule_details():
    Cmax, assign, load = ex2.list_schedule([[7, 3], [7, 3]], [0, 1])
    assert Cmax == 7 and assign == {0: 0, 1: 1} and load == [7, 3]


@pytest.mark.parametrize("seed", range(30))
def test_random(seed):
    rng = random.Random(300 + seed)
    m, n = rng.randint(1, 3), rng.randint(2, 7)
    P = [[rng.randint(1, 9) for _ in range(n)] for _ in range(m)]
    order = list(range(n))
    rng.shuffle(order)
    c, assign, load = ex2.list_schedule(P, order)
    assert len(assign) == n and abs(c - max(load)) < 1e-9
    assert all(abs(load[i] - sum(P[i][j] for j in range(n) if assign[j] == i)) < 1e-9 for i in range(m))
    opt = ex2.opt_cmax(P)[0]
    assert opt == ref_opt(P) and c >= opt


def test_identical_lower_bound():
    p = [7, 3, 5, 2, 8, 5]
    assert ex2.lower_bound_identical(p, 2) == 15
    assert ex2.lower_bound_identical([10, 1, 1], 3) == 10
    for seed in range(10):
        rng = random.Random(seed)
        pp = [rng.randint(1, 9) for _ in range(6)]
        assert ex2.opt_cmax([pp, pp])[0] >= ex2.lower_bound_identical(pp, 2) - 1e-9
