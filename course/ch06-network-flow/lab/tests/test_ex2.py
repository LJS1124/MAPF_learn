import random

import pytest

from labtarget import load
from network import CANON, random_network
from oracle import check_flow, max_flow_value

ex2 = load("ex2_maxflow")


def nets(seed, count):
    rng = random.Random(seed)
    return [random_network(rng, n=rng.randint(4, 9), m=rng.randint(6, 20), max_cap=rng.randint(1, 9)) for _ in range(count)]


def test_canon_value_and_cut():
    r = ex2.max_flow(6, CANON, 0, 5)
    assert r["value"] == 12
    cap = sum(c for u, v, c, _ in CANON if u in r["cut"] and v not in r["cut"])
    assert cap == 12 and 0 in r["cut"] and 5 not in r["cut"]


def test_bfs_needs_fewer_paths_than_dfs_on_canon():
    assert ex2.max_flow(6, CANON, 0, 5, "bfs")["paths"] == 4
    assert ex2.max_flow(6, CANON, 0, 5, "dfs")["value"] == 12


@pytest.mark.parametrize("rule", ["bfs", "dfs"])
@pytest.mark.parametrize("net", nets(21, 50), ids=lambda x: "")
def test_random(net, rule):
    n, arcs = net
    r = ex2.max_flow(n, arcs, 0, n - 1, rule)
    opt = max_flow_value(n, arcs, 0, n - 1)
    ok, val = check_flow(n, arcs, r["flow"], 0, n - 1)
    assert ok and abs(val - r["value"]) < 1e-9 and r["value"] == opt
    cut = r["cut"]
    assert 0 in cut and (n - 1) not in cut
    assert sum(c for u, v, c, _ in arcs if u in cut and v not in cut) == opt, "最小割的容量应等于最大流量"


def test_bfs_path_count_bound():
    """Edmonds–Karp 至多 O(n m) 次增广；在 M 很大的陷阱上只需要 2 次。"""
    M = 1000
    arcs = [(0, 1, M, 0), (0, 2, M, 0), (1, 2, 1, 0), (1, 3, M, 0), (2, 3, M, 0)]
    r = ex2.max_flow(4, arcs, 0, 3, "bfs")
    assert r["value"] == 2 * M and r["paths"] <= 3


def test_uses_backward_arc():
    arcs = [(0, 2, 1, 5), (2, 3, 1, 7), (4, 3, 1, 5), (0, 4, 1, 6), (3, 5, 1, 8), (1, 5, 1, 2), (2, 1, 1, 2)]
    for rule in ("bfs", "dfs"):
        assert ex2.max_flow(6, arcs, 0, 5, rule)["value"] == 2
