import random

import pytest

from labtarget import load
from network import CANON, random_network
from oracle import check_flow, has_neg_cycle, min_cost_lp, some_max_flow

ch = load("challenge_cycles")
ex_ok = True


def start(n, arcs):
    return some_max_flow(n, arcs, 0, n - 1)


def cost(arcs, f):
    return sum(f[k] * arcs[k][3] for k in range(len(arcs)))


def test_canon_reaches_optimum():
    f0 = start(6, CANON)
    r = ch.cancel_cycles(6, CANON, f0)
    assert r["cost"] == 100 == cost(CANON, r["flow"])
    assert check_flow(6, CANON, r["flow"], 0, 5) == (True, 12)


def test_no_iteration_from_optimum():
    r = ch.cancel_cycles(6, CANON, start(6, CANON))
    again = ch.cancel_cycles(6, CANON, r["flow"])
    assert again["iterations"] == 0 and again["history"] == [100]


@pytest.mark.parametrize("seed", range(40))
def test_random(seed):
    rng = random.Random(1200 + seed)
    while True:
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(6, 16), max_cap=rng.randint(1, 5), allow_neg=rng.random() < 0.5)
        if not has_neg_cycle(n, arcs):
            break
    f0 = start(n, arcs)
    v0 = check_flow(n, arcs, f0, 0, n - 1)[1]
    r = ch.cancel_cycles(n, arcs, f0)
    ok, v = check_flow(n, arcs, r["flow"], 0, n - 1)
    assert ok and v == v0
    assert r["cost"] == cost(arcs, r["flow"]) == min_cost_lp(n, arcs, 0, n - 1, v0)
    h = r["history"]
    assert len(h) == r["iterations"] + 1 and h[0] == cost(arcs, f0) and h[-1] == r["cost"]
    assert all(b < a for a, b in zip(h, h[1:])), "每取消一个环，费用必须严格下降"
