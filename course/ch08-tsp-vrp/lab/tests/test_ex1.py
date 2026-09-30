import random

import pytest

from instances import TSP, dist, random_points
from labtarget import load
from oracle import tour_length, tsp_brute

ex1 = load("ex1_tsp")


def test_page_instance():
    D = dist(TSP["P"])
    v, tour = ex1.held_karp(D)
    assert v == 255 and tour_length(D, tour) == 255 and sorted(tour) == list(range(9)) and tour[0] == 0
    val, succ = ex1.assignment_relaxation(D)
    assert val == 198
    assert ex1.find_subtours(succ) == [[0, 2], [1, 7, 8], [3, 5], [4, 6]]


@pytest.mark.parametrize("seed", range(30))
def test_held_karp_random(seed):
    rng = random.Random(100 + seed)
    D = dist(random_points(rng, n=rng.randint(2, 7)))
    v, tour = ex1.held_karp(D)
    assert v == tsp_brute(D) and tour_length(D, tour) == v and sorted(tour) == list(range(len(D))) and tour[0] == 0


def test_trivial():
    assert ex1.held_karp([[0]])[0] == 0
    assert ex1.held_karp([[0, 4], [4, 0]])[0] == 8


@pytest.mark.parametrize("seed", range(20))
def test_assignment_lower_bound(seed):
    rng = random.Random(200 + seed)
    D = dist(random_points(rng, n=rng.randint(4, 7)))
    val, succ = ex1.assignment_relaxation(D)
    assert val <= tsp_brute(D) + 1e-9
    assert sorted(succ) == list(range(len(D))) and all(succ[i] != i for i in range(len(D)))
    assert abs(val - sum(D[i][succ[i]] for i in range(len(D)))) < 1e-9


def test_find_subtours():
    assert ex1.find_subtours([1, 0, 4, 2, 3]) == [[0, 1], [2, 4, 3]]
    assert ex1.find_subtours([1, 2, 0]) == [[0, 1, 2]]
