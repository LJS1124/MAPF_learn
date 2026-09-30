import random

import numpy as np
import pytest

from instances import GAP, random_gap
from labtarget import load
from oracle import gap_ip, gap_lp_ref

ex3 = load("ex3_gap")


def test_page_instance():
    val, x = ex3.gap_lp(GAP["C"], GAP["w"], GAP["Q"])
    assert abs(val - 220) < 1e-6
    assert ex3.gap_enum(GAP["C"], GAP["w"], GAP["Q"])[0] == 234
    frac_tasks = [j for j in range(10) if any(1e-6 < x[i][j] < 1 - 1e-6 for i in range(3))]
    assert frac_tasks == [2]


@pytest.mark.parametrize("seed", range(40))
def test_lp_and_enum_random(seed):
    rng = random.Random(400 + seed)
    C, w, Q = random_gap(rng, m=rng.randint(2, 4), n=rng.randint(4, 7), slack=(0.9, 1.6))
    ip, _ = gap_ip(C, w, Q)
    ref = gap_lp_ref(C, w, Q)
    val, x = ex3.gap_lp(C, w, Q)
    if ref is None:
        assert val is None and ip is None
        return
    assert abs(val - ref[0]) < 1e-6
    ev, ea = ex3.gap_enum(C, w, Q)
    assert ev == ip
    if ip is not None:
        assert val <= ip + 1e-6


def test_loose_capacity_is_integral():
    """载重不起作用时，就是第 5 章的指派（可以一车多任务）：LP 每个任务选最便宜的车，解是整数。"""
    C, w, _ = random_gap(random.Random(5), m=3, n=6)
    val, x = ex3.gap_lp(C, w, [10 ** 6] * 3)
    assert np.allclose(x, np.round(x), atol=1e-6)
    assert val == sum(min(C[i][j] for i in range(3)) for j in range(6))


def test_cuts_are_accepted():
    C, w, Q = GAP["C"], GAP["w"], GAP["Q"]
    v0, _ = ex3.gap_lp(C, w, Q)
    v1, _ = ex3.gap_lp(C, w, Q, [(0, [2, 3, 4, 8], 3)])
    assert v1 >= v0 - 1e-9


def test_infeasible():
    assert ex3.gap_lp([[1, 2]], [5, 5], [6])[0] is None
    assert ex3.gap_enum([[1, 2]], [5, 5], [6])[0] is None
