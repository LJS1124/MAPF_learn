import random

import pytest

from instances import GAP, random_gap
from labtarget import load
from oracle import gap_ip, gap_lp_ref

ch = load("challenge_lagrange")


def test_page_instance():
    b, lam = ch.lagrange_bound(GAP["C"], GAP["w"], GAP["Q"], ub=234)
    assert 219.0 <= b <= 220 + 1e-6, f"拉格朗日下界应逼近 LP 值 220，得到 {b}"
    assert all(x >= 0 for x in lam)


@pytest.mark.parametrize("seed", range(15))
def test_random(seed):
    rng = random.Random(800 + seed)
    C, w, Q = random_gap(rng, m=3, n=7, slack=(1.15, 1.5))
    ip, _ = gap_ip(C, w, Q)
    ref = gap_lp_ref(C, w, Q)
    if ip is None or ref is None:
        pytest.skip("无解")
    b, _ = ch.lagrange_bound(C, w, Q, ub=ip)
    assert b <= ip + 1e-6, "下界不能超过整数最优"
    assert b <= ref[0] + 1e-6, "松弛载重后的下界不会超过 LP 值（松弛后的子问题有整数性）"
    assert b >= ref[0] - max(1.0, 0.01 * ref[0]), f"次梯度上升应接近 LP 值：{b} vs {ref[0]}"
