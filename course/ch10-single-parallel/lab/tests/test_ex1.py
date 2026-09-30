import random

import pytest

from instances import JOB, random_jobs
from labtarget import load
from oracle import best_values, evaluate

ex1 = load("ex1_rules")


def test_page_orders():
    assert ex1.spt_order(JOB["p"]) == [3, 1, 2, 5, 0, 4]
    assert ex1.wspt_order(JOB["p"], JOB["w"]) == [3, 2, 1, 4, 5, 0]
    assert ex1.edd_order(JOB["d"]) == [3, 4, 0, 2, 5, 1]


@pytest.mark.parametrize("seed", range(40))
def test_rules_are_optimal(seed):
    rng = random.Random(100 + seed)
    p, w, d = random_jobs(rng, n=rng.randint(2, 7))
    best = best_values(p, w, d)
    assert evaluate(p, w, d, ex1.spt_order(p))["sumC"] == best["sumC"]
    assert evaluate(p, w, d, ex1.wspt_order(p, w))["sumwC"] == best["sumwC"]
    assert evaluate(p, w, d, ex1.edd_order(d))["Lmax"] == best["Lmax"]


def test_ties_by_index():
    assert ex1.spt_order([3, 3, 1]) == [2, 0, 1]
    assert ex1.wspt_order([2, 4, 6], [1, 2, 3]) == [0, 1, 2]
    assert ex1.edd_order([5, 5, 2]) == [2, 0, 1]
