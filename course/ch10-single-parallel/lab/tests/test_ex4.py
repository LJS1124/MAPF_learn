import random

import pytest

from labtarget import load
from oracle import opt_cmax_identical

ex4 = load("ex4_parallel")


@pytest.mark.parametrize("m", range(2, 7))
def test_worst_instances(m):
    p, order, opt = ex4.worst_list_instance(m)
    assert opt == m and ex4.list_cmax(p, m, order) == 2 * m - 1
    p, order, opt = ex4.lpt_worst_instance(m)
    assert opt == 3 * m and ex4.list_cmax(p, m, order) == 4 * m - 1
    assert len(p) == 2 * m + 1


@pytest.mark.parametrize("m", [2, 3])
def test_worst_instances_optimum_is_real(m):
    p, _, opt = ex4.worst_list_instance(m)
    assert opt_cmax_identical(p, m) == opt
    p, _, opt = ex4.lpt_worst_instance(m)
    assert opt_cmax_identical(p, m) == opt


@pytest.mark.parametrize("seed", range(30))
def test_graham_and_lpt_bounds(seed):
    rng = random.Random(100 + seed)
    m, n = rng.randint(2, 3), rng.randint(3, 8)
    p = [rng.randint(1, 9) for _ in range(n)]
    opt = opt_cmax_identical(p, m)
    order = list(range(n))
    rng.shuffle(order)
    assert ex4.list_cmax(p, m, order) <= (2 - 1 / m) * opt + 1e-9
    assert ex4.list_cmax(p, m, ex4.lpt_order(p)) <= (4 / 3 - 1 / (3 * m)) * opt + 1e-9


def test_lpt_order():
    assert ex4.lpt_order([3, 8, 8, 1]) == [1, 2, 0, 3]


@pytest.mark.parametrize("seed", range(25))
def test_mcnaughton(seed):
    rng = random.Random(200 + seed)
    m, n = rng.randint(1, 4), rng.randint(2, 8)
    p = [rng.randint(1, 9) for _ in range(n)]
    C, slots = ex4.mcnaughton(p, m)
    assert abs(C - max(max(p), sum(p) / m)) < 1e-9
    assert len(slots) == m
    per_job = {}
    for i, sl in enumerate(slots):
        assert sum(e - s for _, s, e in sl) <= C + 1e-9
        ends = 0
        for j, s, e in sl:
            assert s >= ends - 1e-9 and e <= C + 1e-9
            ends = e
            per_job.setdefault(j, []).append((s, e))
    for j in range(n):
        assert abs(sum(e - s for s, e in per_job[j]) - p[j]) < 1e-9
        iv = sorted(per_job[j])
        assert all(b[0] >= a[1] - 1e-9 for a, b in zip(iv, iv[1:])), "同一个作业的两段不能在时间上重叠"


def test_mcnaughton_example():
    C, slots = ex4.mcnaughton([9, 9, 9, 3], 3)
    assert C == 10 and [j for j, _, _ in slots[0]] == [0, 1]
