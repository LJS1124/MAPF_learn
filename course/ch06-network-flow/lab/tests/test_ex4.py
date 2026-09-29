import random

import numpy as np
import pytest
from scipy.optimize import linear_sum_assignment

from labtarget import load
from network import CANON, random_network
from oracle import max_flow_value, node_cap_max_flow, check_flow

ex4 = load("ex4_model")
ex2 = load("ex2_maxflow")

DEFAULT_C = [[24, 83, 38, 71, 82], [18, 61, 32, 49, 60], [6, 85, 36, 73, 84], [76, 43, 90, 9, 42], [68, 23, 82, 23, 10], [32, 75, 46, 63, 74]]


def test_network_shape():
    n, arcs, s, t = ex4.assignment_network(DEFAULT_C)
    assert n == 13 and s == 0 and t == 12 and len(arcs) == 6 + 30 + 5
    assert arcs[0] == (0, 1, 1, 0) and arcs[6] == (1, 7, 1, 24) and arcs[-1] == (11, 12, 1, 0)


def test_default_scenario():
    total, assign = ex4.solve_assignment(DEFAULT_C)
    assert total == 124
    assert assign == [2, 1, 0, 3, 4] or sum(DEFAULT_C[i][j] for j, i in enumerate(assign)) == 124
    assert len(set(assign)) == 5


@pytest.mark.parametrize("seed", range(30))
def test_random_against_scipy(seed):
    rng = np.random.default_rng(700 + seed)
    m = int(rng.integers(3, 8))
    n = int(rng.integers(2, m + 1))
    C = rng.integers(1, 100, size=(m, n)).tolist()
    total, assign = ex4.solve_assignment(C)
    r, c = linear_sum_assignment(np.array(C))
    assert total == np.array(C)[r, c].sum()
    assert sum(C[i][j] for j, i in enumerate(assign)) == total and len(set(assign)) == n


def test_split_nodes_shape():
    n2, arcs2, s2, t2 = ex4.split_nodes(6, CANON, 0, 5, {3: 2})
    assert n2 == 12 and s2 == 6 and t2 == 5
    assert arcs2[0] == (6, 1, 7, 2)
    assert len(arcs2) == len(CANON) + 6
    assert arcs2[len(CANON) + 3] == (3, 9, 2, 0)


def test_split_nodes_canon_value():
    n2, arcs2, s2, t2 = ex4.split_nodes(6, CANON, 0, 5, {3: 2})
    assert ex2.max_flow(n2, arcs2, s2, t2)["value"] == node_cap_max_flow(6, CANON, 0, 5, {3: 2}) == 8


@pytest.mark.parametrize("seed", range(30))
def test_split_nodes_random(seed):
    rng = random.Random(900 + seed)
    n, arcs = random_network(rng, n=rng.randint(5, 8), m=rng.randint(8, 16), max_cap=6)
    caps = {v: rng.randint(1, 4) for v in rng.sample(range(1, n - 1), 2)}
    n2, arcs2, s2, t2 = ex4.split_nodes(n, arcs, 0, n - 1, caps)
    assert ex2.max_flow(n2, arcs2, s2, t2)["value"] == node_cap_max_flow(n, arcs, 0, n - 1, caps)
