import itertools
import random

import pytest

from instances import JOB, random_jobs
from labtarget import load
from oracle import best_values, evaluate as ref_eval

ex1 = load("ex1_metrics")
KEYS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"]


def test_page_instance_spt():
    p, w, d = JOB["p"], JOB["w"], JOB["d"]
    r = [0] * 6
    spt = sorted(range(6), key=lambda j: (p[j], j))
    e = ex1.evaluate(p, w, d, r, spt)
    assert (e["Cmax"], e["sumC"], e["sumwC"], e["Lmax"], e["sumT"], e["sumU"], e["sumwU"]) == (30, 84, 252, 21, 30, 2, 6)
    fifo = ex1.evaluate(p, w, d, r, list(range(6)))
    assert (fifo["sumC"], fifo["Lmax"], fifo["sumU"]) == (104, 16, 3)


def test_page_instance_best():
    b = ex1.best_by(JOB["p"], JOB["w"], JOB["d"], [0] * 6)
    assert {k: b[k][0] for k in KEYS} == {"Cmax": 30, "sumC": 84, "sumwC": 234, "Lmax": 7, "sumT": 18, "sumU": 1, "sumwU": 4}
    assert ex1.evaluate(JOB["p"], JOB["w"], JOB["d"], [0] * 6, list(b["sumC"][1]))["sumC"] == 84


@pytest.mark.parametrize("seed", range(40))
def test_evaluate_random(seed):
    rng = random.Random(100 + seed)
    p, w, d, r = random_jobs(rng, n=rng.randint(1, 7), releases=seed % 2 == 1)
    seq = list(range(len(p)))
    rng.shuffle(seq)
    got = ex1.evaluate(p, w, d, r, seq)
    ref = ref_eval(p, w, d, r, seq)
    assert all(abs(got[k] - ref[k]) < 1e-9 for k in KEYS)


@pytest.mark.parametrize("seed", range(15))
def test_best_by_random(seed):
    rng = random.Random(200 + seed)
    p, w, d, r = random_jobs(rng, n=rng.randint(2, 6), releases=seed % 2 == 0)
    b = ex1.best_by(p, w, d, r)
    ref = best_values(p, w, d, r)
    for k in KEYS:
        assert abs(b[k][0] - ref[k]) < 1e-9
        assert abs(ex1.evaluate(p, w, d, r, list(b[k][1]))[k] - ref[k]) < 1e-9
