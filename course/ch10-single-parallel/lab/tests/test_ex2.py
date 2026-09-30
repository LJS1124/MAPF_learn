import random

import pytest

from instances import JOB, JOB2, random_jobs
from labtarget import load
from oracle import best_values, evaluate

ex2 = load("ex2_moore")


def test_page_instances():
    seq, u = ex2.moore_hodgson(JOB["p"], JOB["d"])
    assert u == 1 and seq == [3, 0, 2, 5, 1, 4]
    seq, u = ex2.moore_hodgson(JOB2["p"], JOB2["d"])
    assert u == 3 and seq == [0, 4, 3, 5, 2, 1, 6]


@pytest.mark.parametrize("seed", range(50))
def test_random(seed):
    rng = random.Random(200 + seed)
    p, w, d = random_jobs(rng, n=rng.randint(2, 7))
    seq, u = ex2.moore_hodgson(p, d)
    assert sorted(seq) == list(range(len(p)))
    assert evaluate(p, w, d, seq)["sumU"] == u == best_values(p, w, d)["sumU"]
