import random

import pytest

from instances import GAP, random_gap
from labtarget import load
from oracle import gap_feasible_assignments, gap_ip

ex3 = load("ex3_gap")
ex4 = load("ex4_cuts")


def test_separate_basic():
    S = ex4.separate_cover([0.5, 0.5, 1, 1, 0, 0], [4, 3, 4, 6, 4, 3], 15)
    assert S is None or sum([4, 3, 4, 6, 4, 3][j] for j in S) > 15
    row = [0.0, 0.0, 0.5, 1, 1, 0, 0, 0, 1, 0]
    assert ex4.separate_cover(row, GAP["w"], 15) == [2, 3, 4, 8]


def test_page_instance_rounds():
    r = ex4.cut_loop(GAP["C"], GAP["w"], GAP["Q"])
    assert [round(v, 3) for v in r["rounds"]] == [220.0, 229.0, 233.0]
    assert len(r["cuts"]) == 4 and abs(r["final"] - 233) < 1e-6
    assert gap_ip(GAP["C"], GAP["w"], GAP["Q"])[0] == 234


@pytest.mark.parametrize("seed", range(25))
def test_cuts_valid_and_bound_monotone(seed):
    rng = random.Random(600 + seed)
    C, w, Q = random_gap(rng, m=3, n=6, slack=(1.0, 1.4))
    ip, _ = gap_ip(C, w, Q)
    if ip is None:
        pytest.skip("无解")
    r = ex4.cut_loop(C, w, Q)
    assert all(b >= a - 1e-7 for a, b in zip(r["rounds"], r["rounds"][1:])), "根节点的下界只增不减"
    assert r["final"] <= ip + 1e-6, "加割之后的 LP 值不能超过整数最优"
    for (i, S, k) in r["cuts"]:
        assert k == len(S) - 1 and sum(w[j] for j in S) > Q[i]
        assert all(sum(w[t] for t in S if t != j) <= Q[i] for j in S), "覆盖必须是极小的"
    for a in gap_feasible_assignments(C, w, Q):
        for (i, S, k) in r["cuts"]:
            assert sum(1 for j in S if a[j] == i) <= k, "每一个整数可行派法都必须满足这些割"
