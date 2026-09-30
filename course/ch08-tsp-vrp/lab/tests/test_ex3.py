import random

import pytest

from instances import TSP, dist, random_points
from labtarget import load
from oracle import full_sec_lp, lp_with_secs, mtz_lp_ref, tsp_brute

ex3 = load("ex3_mtz")


def test_page_instance():
    assert ex3.mtz_lp(dist(TSP["P"])) == pytest.approx(203.25, abs=1e-6)


@pytest.mark.parametrize("seed", range(25))
def test_random(seed):
    rng = random.Random(400 + seed)
    D = dist(random_points(rng, n=rng.randint(4, 7)))
    v = ex3.mtz_lp(D)
    assert v == pytest.approx(mtz_lp_ref(D), abs=1e-6)
    assign = lp_with_secs(D, [])[0]
    assert assign - 1e-6 <= v <= full_sec_lp(D) + 1e-6 <= tsp_brute(D) + 1e-5, "指派松弛 ≤ MTZ ≤ 子回路下界 ≤ 最优"
