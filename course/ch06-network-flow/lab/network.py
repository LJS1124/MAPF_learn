"""本章的网络与生成器。弧是 (u, v, cap, cost) 元组，点是 0..n-1 的整数。

CANON 是页面里的那张 6 个点的网络：S=0, a=1, b=2, c=3, d=4, T=5。
"""
import random

NAMES = ["S", "a", "b", "c", "d", "T"]
CANON = [
    (0, 1, 7, 2), (0, 2, 6, 2), (1, 2, 5, 1), (1, 3, 4, 3), (2, 3, 2, 4),
    (2, 4, 4, 1), (3, 4, 6, 4), (3, 5, 6, 4), (4, 5, 7, 4), (1, 4, 2, 2),
]
NEG_ARC = (3, 2, 3, -4)                  # c→b，费用 −4，只在“负权”版本里出现
CANON_NEG = CANON + [NEG_ARC]
INF = float("inf")


def random_network(rng, n=7, m=14, max_cap=6, max_cost=9, allow_neg=False, neg_cycle=False):
    """随机网络，源 0，汇 n-1。allow_neg=True 时费用可为负但保证没有负环（用势构造）；
    neg_cycle=True 时额外塞入一个负环。"""
    pot = [rng.randint(0, 6) if allow_neg else 0 for _ in range(n)]
    seen, arcs = set(), []
    tries = 0
    while len(arcs) < m and tries < 500:
        tries += 1
        u, v = rng.sample(range(n), 2)
        if (u, v) in seen or u == n - 1 or v == 0:
            continue
        seen.add((u, v))
        w = rng.randint(0, max_cost)
        arcs.append((u, v, rng.randint(1, max_cap), w + pot[u] - pot[v]))
    if neg_cycle:
        a, b, c = rng.sample(range(1, n - 1), 3)
        for (u, v), w in (((a, b), 2), ((b, c), 2), ((c, a), -6)):
            arcs = [x for x in arcs if (x[0], x[1]) != (u, v)]
            arcs.append((u, v, rng.randint(1, max_cap), w))
    return n, arcs


def cost_of(arcs, flow):
    return sum(flow[k] * arcs[k][3] for k in range(len(arcs)))
