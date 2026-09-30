import random

import pytest

from instances import TSP, dist, random_points
from labtarget import load
from oracle import tour_length

ch = load("challenge_2opt")


def nn(D):
    n = len(D)
    tour, used = [0], {0}
    while len(tour) < n:
        cur = tour[-1]
        j = min((j for j in range(n) if j not in used), key=lambda j: (D[cur][j], j))
        tour.append(j)
        used.add(j)
    return tour


def test_page_instance():
    D = dist(TSP["P"])
    start = nn(D)
    assert tour_length(D, start) == 290
    r = ch.two_opt(D, start)
    assert tour_length(D, r["tour"]) == 262 and r["steps"] == [-3, -25]


@pytest.mark.parametrize("seed", range(25))
def test_random(seed):
    rng = random.Random(700 + seed)
    D = dist(random_points(rng, n=rng.randint(5, 12)))
    start = nn(D)
    r = ch.two_opt(D, start)
    t = r["tour"]
    assert sorted(t) == list(range(len(D))) and t[0] == 0
    assert tour_length(D, t) == tour_length(D, start) + sum(r["steps"])
    assert all(s < 0 for s in r["steps"])
    n = len(t)
    for i in range(1, n - 1):
        for j in range(i + 1, n):
            a, b, c, d = t[i - 1], t[i], t[j], t[(j + 1) % n]
            assert D[a][c] + D[b][d] - D[a][b] - D[c][d] >= 0, "结果里还有能缩短路线的 2-opt"
