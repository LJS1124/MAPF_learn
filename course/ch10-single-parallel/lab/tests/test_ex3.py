import random

import pytest

from instances import JOB, random_jobs
from labtarget import load
from oracle import evaluate

ex3 = load("ex3_exchange")


@pytest.mark.parametrize("seed", range(30))
def test_swap_delta(seed):
    rng = random.Random(100 + seed)
    p, w, d = random_jobs(rng, n=6)
    seq = list(range(6))
    rng.shuffle(seq)
    i = rng.randint(0, 4)
    new = seq[:]
    new[i], new[i + 1] = new[i + 1], new[i]
    for obj in ("sumC", "sumwC"):
        assert ex3.swap_delta(p, w, seq, i, obj) == evaluate(p, w, d, new)[obj] - evaluate(p, w, d, seq)[obj]


def test_page_path_lengths():
    p, w, d = JOB["p"], JOB["w"], JOB["d"]
    for rule, n in (("SPT", 7), ("WSPT", 8), ("EDD", 8)):
        path, final = ex3.bubble_path(p, w, d, list(range(6)), rule)
        assert len(path) == n
    assert ex3.bubble_path(p, w, d, list(range(6)), "SPT")[1] == [3, 1, 2, 5, 0, 4]


@pytest.mark.parametrize("seed", range(30))
def test_matched_rules_never_worsen(seed):
    rng = random.Random(300 + seed)
    p, w, d = random_jobs(rng, n=rng.randint(3, 7))
    start = list(range(len(p)))
    rng.shuffle(start)
    for rule, obj in (("SPT", "sumC"), ("WSPT", "sumwC"), ("EDD", "Lmax")):
        path, final = ex3.bubble_path(p, w, d, start, rule)
        vals = [evaluate(p, w, d, s)[obj] for s in [start] + path]
        assert all(b <= a for a, b in zip(vals, vals[1:])), f"{rule} 的交换不应让 {obj} 变差"
        inv = sum(1 for i in range(len(start)) for j in range(i + 1, len(start)) if ex3_before(rule, p, w, d, start[j], start[i]))
        assert len(path) == inv, "冒泡交换的次数等于逆序对个数"


def ex3_before(rule, p, w, d, a, b):
    from fractions import Fraction
    if rule == "SPT":
        return p[a] < p[b]
    if rule == "WSPT":
        return Fraction(p[a], w[a]) < Fraction(p[b], w[b])
    return d[a] < d[b]
