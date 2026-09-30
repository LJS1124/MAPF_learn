import random

import pytest

from instances import KNAP, random_knap
from labtarget import load
from oracle import knap_brute, knap_lp_ref

ex1 = load("ex1_knapsack")


def test_page_instance():
    b, x, frac = ex1.knap_lp(KNAP["v"], KNAP["w"], KNAP["cap"])
    assert abs(b - 106.857142857) < 1e-6 and frac == 5
    assert sum(1 for t in x if 0 < t < 1) == 1 and 0 < x[5] < 1
    assert ex1.knap_dp(KNAP["v"], KNAP["w"], KNAP["cap"])[0] == 104


@pytest.mark.parametrize("seed", range(40))
def test_lp_random(seed):
    v, w, cap = random_knap(random.Random(100 + seed))
    b, x, frac = ex1.knap_lp(v, w, cap)
    assert abs(b - knap_lp_ref(v, w, cap)) < 1e-6
    assert sum(w[j] * x[j] for j in range(len(v))) <= cap + 1e-9
    assert sum(1 for t in x if 1e-9 < t < 1 - 1e-9) <= 1, "背包 LP 至多一个分数变量"
    assert (frac >= 0) == any(1e-9 < t < 1 - 1e-9 for t in x)


@pytest.mark.parametrize("seed", range(40))
def test_dp_random(seed):
    v, w, cap = random_knap(random.Random(200 + seed))
    val, take = ex1.knap_dp(v, w, cap)
    assert val == knap_brute(v, w, cap)[0]
    assert sum(v[j] for j in range(len(v)) if take[j]) == val and sum(w[j] for j in range(len(v)) if take[j]) <= cap


def test_fixed_variables():
    v, w = [10, 7, 4], [5, 4, 3]
    b, x, _ = ex1.knap_lp(v, w, 8, [1, -1, 0])
    assert abs(b - (10 + 7 * 3 / 4)) < 1e-9 and x[0] == 1 and x[2] == 0
    assert ex1.knap_lp(v, w, 4, [1, -1, -1])[0] == float("-inf")
