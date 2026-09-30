import random

import pytest

from labtarget import load
from oracle import opt_cmax_identical

ch = load("challenge_p2")


def test_page():
    assert ch.p2_opt([7, 3, 5, 2, 8, 5]) == 15


@pytest.mark.parametrize("seed", range(30))
def test_random(seed):
    rng = random.Random(100 + seed)
    p = [rng.randint(1, 20) for _ in range(rng.randint(2, 9))]
    assert ch.p2_opt(p) == opt_cmax_identical(p, 2)


def test_large_is_fast():
    p = [random.Random(1).randint(1, 50) for _ in range(300)]
    assert ch.p2_opt(p) >= sum(p) / 2
