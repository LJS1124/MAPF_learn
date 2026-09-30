import itertools
import random

import pytest

from instances import FLOW2, random_flow
from labtarget import load
from oracle import enum_flow, flow_cmax

ex1 = load("ex1_flow")


def test_page_f2():
    assert ex1.johnson(FLOW2) == [0, 5, 1, 2, 4, 3]
    assert ex1.flow_makespan(FLOW2, ex1.johnson(FLOW2)) == 31
    assert ex1.flow_makespan(FLOW2, list(range(6))) == 35


@pytest.mark.parametrize("seed", range(40))
def test_makespan_random(seed):
    rng = random.Random(100 + seed)
    P = random_flow(rng, n=rng.randint(1, 6), m=rng.randint(1, 4))
    perm = list(range(len(P)))
    rng.shuffle(perm)
    assert ex1.flow_makespan(P, perm) == flow_cmax(P, perm)


@pytest.mark.parametrize("seed", range(40))
def test_johnson_is_optimal(seed):
    rng = random.Random(200 + seed)
    P = random_flow(rng, n=rng.randint(2, 7), m=2)
    order = ex1.johnson(P)
    assert sorted(order) == list(range(len(P)))
    assert ex1.flow_makespan(P, order) == enum_flow(P)


def test_johnson_ties():
    P = [[3, 3], [2, 2], [5, 1]]
    assert ex1.johnson(P) == [1, 0, 2]
