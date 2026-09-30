import random

import numpy as np
import pytest

from instances import TSP, dist, random_points
from labtarget import load
from oracle import full_sec_lp, lp_with_secs, tsp_brute

ex2 = load("ex2_sec")


def test_separate_integral_subtours():
    n = 6
    x = np.zeros((n, n))
    for a, b in [(0, 1), (1, 0), (2, 3), (3, 4), (4, 2), (5, 5 - 0)][:5]:
        x[a, b] = 1
    x[5, 0] = 0
    # 0↔1 一个回路含仓库；2→3→4→2 是子回路；点 5 孤立（出入度不满足，但分离只看流）
    S = ex2.separate_sec(x)
    assert [2, 3, 4] in S


def test_separate_none_when_tour():
    n = 5
    x = np.zeros((n, n))
    order = [0, 3, 1, 4, 2]
    for i in range(n):
        x[order[i], order[(i + 1) % n]] = 1
    assert ex2.separate_sec(x) == []


def test_separate_fractional():
    """两个点各向仓库送 0.5、彼此之间来回 1：从仓库到它们的流量不足 1。"""
    x = np.zeros((3, 3))
    x[0, 1] = 0.5
    x[0, 2] = 0.5
    x[1, 2] = 0.5
    x[2, 1] = 0.5
    x[1, 0] = 0.5
    x[2, 0] = 0.5
    assert ex2.separate_sec(x) == []
    y = np.zeros((4, 4))
    y[0, 1] = 0.5
    y[1, 2] = 1
    y[2, 3] = 1
    y[3, 1] = 1
    y[2, 0] = 0.5
    S = ex2.separate_sec(y)
    assert all(len(s) >= 2 for s in S)


@pytest.mark.parametrize("seed", range(25))
def test_cut_loop_reaches_subtour_bound(seed):
    rng = random.Random(300 + seed)
    D = dist(random_points(rng, n=rng.randint(5, 7)))
    r = ex2.cut_loop(D)
    assert abs(r["final"] - full_sec_lp(D)) < 1e-6, "循环停下时的值应当等于加入全部子回路约束的 LP 值"
    assert all(b >= a - 1e-7 for a, b in zip(r["rounds"], r["rounds"][1:])), "下界只增不减"
    assert r["final"] <= tsp_brute(D) + 1e-6
    assert len(r["secs"]) < 2 ** (len(D) - 1), "分离出的约束应当远少于全部子集"


def test_page_instance():
    D = dist(TSP["P"])
    r = ex2.cut_loop(D)
    assert abs(r["final"] - 255) < 1e-6 and r["rounds"][0] == pytest.approx(198)
