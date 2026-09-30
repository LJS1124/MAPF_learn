import random

import pytest

from instances import FLOW3, random_flow
from labtarget import load
from oracle import enum_flow, flow_cmax

ex2 = load("ex2_neh")


def test_page_f3():
    seq, c = ex2.neh(FLOW3)
    assert seq == [4, 0, 3, 2, 5, 1] and c == 44
    assert enum_flow(FLOW3) == 42 and flow_cmax(FLOW3, list(range(6))) == 52


@pytest.mark.parametrize("seed", range(30))
def test_random(seed):
    rng = random.Random(300 + seed)
    P = random_flow(rng, n=rng.randint(2, 7), m=rng.randint(2, 4))
    seq, c = ex2.neh(P)
    assert sorted(seq) == list(range(len(P))) and c == flow_cmax(P, seq)
    opt = enum_flow(P)
    assert c >= opt
    assert c <= 1.15 * opt + 1e-9, "NEH 在这样的小实例上通常离最优不远"
