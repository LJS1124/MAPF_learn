import random

import pytest

from instances import CVRP, dist, random_points
from labtarget import load
from oracle import cvrp_brute

ex4 = load("ex4_cvrp")


def test_page_instance():
    D = dist(CVRP["P"])
    v, routes = ex4.cvrp_opt(D, CVRP["dem"], CVRP["Q"], CVRP["K"])
    assert v == 360
    ok, total = ex4.check_routes(D, CVRP["dem"], CVRP["Q"], CVRP["K"], routes)
    assert ok and total == 360
    sv, sr = ex4.sweep(CVRP["P"], D, CVRP["dem"], CVRP["Q"])
    assert sv == 419 and ex4.check_routes(D, CVRP["dem"], CVRP["Q"], CVRP["K"], sr) == (True, 419)


def test_check_routes():
    D = dist(CVRP["P"])
    assert ex4.check_routes(D, CVRP["dem"], CVRP["Q"], 3, [[1, 2, 3, 4, 5, 6, 7, 8]])[0] is False
    assert ex4.check_routes(D, CVRP["dem"], CVRP["Q"], 3, [[1, 2, 3], [4, 5], [6, 7]])[0] is False
    assert ex4.route_length(D, []) == 0


@pytest.mark.parametrize("seed", range(20))
def test_opt_random(seed):
    rng = random.Random(500 + seed)
    m = rng.randint(3, 6)
    P = random_points(rng, n=m)
    D = dist(P)
    dem = [rng.randint(1, 4) for _ in range(m)]
    Q = rng.randint(max(dem), sum(dem))
    K = rng.randint(1, 3)
    v, routes = ex4.cvrp_opt(D, dem, Q, K)
    ref = cvrp_brute(D, dem, Q, K)
    assert v == ref
    if v is not None:
        assert ex4.check_routes(D, dem, Q, K, routes) == (True, v)


@pytest.mark.parametrize("seed", range(15))
def test_sweep_feasible_and_no_better_than_opt(seed):
    rng = random.Random(600 + seed)
    m = rng.randint(4, 7)
    P = random_points(rng, n=m)
    D = dist(P)
    dem = [rng.randint(1, 4) for _ in range(m)]
    Q = rng.randint(max(dem), sum(dem))
    sv, routes = ex4.sweep(P, D, dem, Q)
    ok, total = ex4.check_routes(D, dem, Q, len(routes), routes)
    assert ok and total == sv
    opt, _ = ex4.cvrp_opt(D, dem, Q, len(routes))
    assert sv >= opt
