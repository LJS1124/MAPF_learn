import random

import pytest

from instances import KNAP, random_knap
from labtarget import load
from oracle import knap_brute

ex2 = load("ex2_knapbb")


def test_page_instance_tree():
    r = ex2.knap_bb(KNAP["v"], KNAP["w"], KNAP["cap"])
    assert r["best"] == 104 and r["nodes"] == 15
    assert sum(KNAP["v"][j] for j in range(8) if r["take"][j]) == 104


@pytest.mark.parametrize("seed", range(50))
def test_random(seed):
    v, w, cap = random_knap(random.Random(300 + seed), n=random.Random(seed).randint(5, 12))
    r = ex2.knap_bb(v, w, cap)
    assert r["best"] == knap_brute(v, w, cap)[0]
    assert sum(w[j] for j in range(len(v)) if r["take"][j]) <= cap
    assert 1 <= r["nodes"] <= 2 ** (len(v) + 1) - 1


def test_pruning_beats_full_enumeration():
    v, w, cap = random_knap(random.Random(9), n=14)
    assert ex2.knap_bb(v, w, cap)["nodes"] < 2 ** 15 - 1
