import random

import pytest

from labtarget import load
from network import CANON, CANON_NEG
from network import random_network
from oracle import certificate_ok, check_flow, has_neg_cycle, max_flow_value, min_cost_lp

ex3 = load("ex3_mincost")


def nets(seed, count, neg):
    rng = random.Random(seed)
    out = []
    while len(out) < count:
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(6, 16), max_cap=rng.randint(1, 6), allow_neg=neg)
        if not has_neg_cycle(n, arcs):
            out.append((n, arcs))
    return out


def test_canon_marginals():
    curve = ex3.cost_curve(6, CANON, 0, 5)
    assert [b - a for a, b in zip(curve, curve[1:])] == [7, 7, 7, 7, 8, 8, 9, 9, 9, 9, 10, 10]
    r = ex3.min_cost_flow(6, CANON, 0, 5)
    assert r["value"] == 12 and r["cost"] == 100


def test_canon_k5():
    r = ex3.min_cost_flow(6, CANON, 0, 5, 5)
    assert r["value"] == 5 and r["cost"] == 7 * 4 + 8


@pytest.mark.parametrize("net", nets(31, 40, False) + nets(32, 40, True), ids=lambda x: "")
def test_random_against_lp(net):
    n, arcs = net
    f = max_flow_value(n, arcs, 0, n - 1)
    for k in sorted({0, min(1, f), f // 2, f}):
        r = ex3.min_cost_flow(n, arcs, 0, n - 1, k)
        ref = min_cost_lp(n, arcs, 0, n - 1, k)
        ok, val = check_flow(n, arcs, r["flow"], 0, n - 1)
        assert ok and val == r["value"] == k
        assert r["cost"] == ref == sum(r["flow"][e] * arcs[e][3] for e in range(len(arcs)))
        assert certificate_ok(n, arcs, r["flow"], r["pi"]), "势不满足最优性证书：残量图里有约化成本为负的弧"


def test_max_flow_default_and_cap():
    r = ex3.min_cost_flow(6, CANON, 0, 5, 100)
    assert r["value"] == 12


def test_cost_curve_is_convex():
    for n, arcs in nets(33, 25, True):
        c = ex3.cost_curve(n, arcs, 0, n - 1)
        inc = [b - a for a, b in zip(c, c[1:])]
        assert all(y >= x for x, y in zip(inc, inc[1:])), "费用曲线应当是凸的（边际成本不下降）"


def test_negative_arc_canon():
    r = ex3.min_cost_flow(6, CANON_NEG, 0, 5, 1)
    assert r["cost"] == min_cost_lp(6, CANON_NEG, 0, 5, 1) == 6
