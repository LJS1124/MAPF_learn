import random

import pytest

from labtarget import load
from network import CANON, CANON_NEG, INF, NAMES, random_network
from oracle import has_neg_cycle, shortest_dist

ex1 = load("ex1_paths")


def nets(seed, count, **kw):
    rng = random.Random(seed)
    out = []
    while len(out) < count:
        n, arcs = random_network(rng, n=rng.randint(4, 8), m=rng.randint(5, 16), **kw)
        out.append((n, arcs))
    return out


def same(d, ref):
    return all((a == INF) == (b == INF) and (a == INF or abs(a - b) < 1e-9) for a, b in zip(d, ref))


def test_dijkstra_canon():
    d, pred = ex1.dijkstra(6, CANON, 0)
    assert d == [0, 2, 2, 5, 3, 7]
    assert [CANON[k][:2] for k in ex1.path_to(CANON, pred, 5)] == [(0, 1), (1, 3), (3, 5)] or \
           [CANON[k][:2] for k in ex1.path_to(CANON, pred, 5)] == [(0, 2), (2, 4), (4, 5)] or \
           sum(CANON[k][3] for k in ex1.path_to(CANON, pred, 5)) == 7


@pytest.mark.parametrize("net", nets(11, 60), ids=lambda x: "")
def test_dijkstra_random(net):
    n, arcs = net
    d, pred = ex1.dijkstra(n, arcs, 0)
    ref, _ = shortest_dist(n, arcs, 0)
    assert same(d, ref)
    for v in range(1, n):
        if d[v] < INF:
            p = ex1.path_to(arcs, pred, v)
            assert sum(arcs[k][3] for k in p) == d[v]
            assert arcs[p[0]][0] == 0 and arcs[p[-1]][1] == v


def test_dijkstra_rejects_negative():
    with pytest.raises(ValueError):
        ex1.dijkstra(6, CANON_NEG, 0)


def test_dijkstra_is_wrong_on_negative_but_bellman_is_right():
    d, _, cyc = ex1.bellman_ford(6, CANON_NEG, 0)
    assert cyc is None and d == [0, 2, 1, 5, 2, 6]
    # 去掉 Dijkstra 的检查，直接跑一遍会得到 7：这里只验证 Bellman–Ford 的数
    assert shortest_dist(6, CANON_NEG, 0)[0] == d


@pytest.mark.parametrize("net", nets(12, 60, allow_neg=True), ids=lambda x: "")
def test_bellman_ford_negative_arcs(net):
    n, arcs = net
    d, _, cyc = ex1.bellman_ford(n, arcs, 0)
    ref, neg = shortest_dist(n, arcs, 0)
    assert cyc is None and not neg
    assert same(d, ref)


@pytest.mark.parametrize("seed", range(25))
def test_bellman_ford_finds_negative_cycle(seed):
    rng = random.Random(500 + seed)
    n, arcs = random_network(rng, n=rng.randint(5, 8), m=rng.randint(8, 14), allow_neg=True, neg_cycle=True)
    d, pred, cyc = ex1.bellman_ford(n, arcs, 0)
    from oracle import floyd
    dist, _ = floyd(n, arcs)
    reachable_neg = any(dist[0][v] < INF and dist[v][v] < 0 for v in range(n))
    if not reachable_neg:
        assert cyc is None
        return
    assert cyc is not None and len(cyc) >= 2
    total = 0
    for a, b in zip(cyc, cyc[1:] + cyc[:1]):
        w = min(x[3] for x in arcs if x[0] == a and x[1] == b)
        total += w
    assert total < 0, "返回的点列不是一个负环（按前进方向依次相连，费用之和应为负）"


@pytest.mark.parametrize("net", nets(13, 60, allow_neg=True), ids=lambda x: "")
def test_johnson(net):
    n, arcs = net
    d, h = ex1.johnson(n, arcs, 0)
    ref, _ = shortest_dist(n, arcs, 0)
    assert same(d, ref)
    assert all(w + h[u] - h[v] >= -1e-9 for (u, v, _, w) in arcs), "重新赋权后的费用应当都 >= 0"


def test_johnson_detects_negative_cycle():
    arcs = [(0, 1, 1, 2), (1, 2, 1, 2), (2, 1, 1, -5), (1, 3, 1, 1)]
    assert ex1.johnson(4, arcs, 0) == (None, None)
    assert ex1.johnson(6, CANON_NEG, 0)[0] == [0, 2, 1, 5, 2, 6]
