import random

import numpy as np
import pytest

from labtarget import load
from oracle import hall_violation_ok, opt_with_deferral

ex3 = load("ex3_dispatch")


def random_case(rng):
    m = rng.randint(1, 5)
    n = rng.randint(1, 5)
    C = np.array([[rng.randint(1, 40) for _ in range(n)] for _ in range(m)], float)
    p_allow = rng.choice((1.0, 0.85, 0.6))
    allowed = np.array([[rng.random() < p_allow for _ in range(n)] for _ in range(m)])
    kind = rng.choice(("none", "scalar", "array"))
    if kind == "none":
        pen = None
    elif kind == "scalar":
        pen = float(rng.randint(5, 80))
    else:
        pen = np.array([rng.randint(5, 80) for _ in range(n)], float)
    return C, allowed, pen


def recompute(C, allowed, pen, res):
    n = C.shape[1]
    total = 0.0
    used = []
    for j, i in enumerate(res.assign):
        if i is None:
            assert pen is not None, "没给 penalty，任务不能延后"
            total += float(np.broadcast_to(np.asarray(pen, float), (n,))[j])
        else:
            assert allowed[i][j], f"用到了禁行边 V{i + 1}→T{j + 1}"
            total += float(C[i][j])
            used.append(i)
    assert len(used) == len(set(used)), "一辆车被派了两个任务"
    return total


def test_matches_bruteforce():
    rng = random.Random(2024)
    for _ in range(400):
        C, allowed, pen = random_case(rng)
        best, _ = opt_with_deferral(C, allowed, pen)
        res = ex3.dispatch(C, allowed, pen)
        if best == float("inf"):
            assert not res.feasible
            continue
        assert res.feasible
        assert abs(recompute(C, allowed, pen, res) - best) < 1e-9
        assert abs(res.total - best) < 1e-9
        assert sorted(res.deferred) == sorted(j for j, i in enumerate(res.assign) if i is None)


def test_infeasible_reports_hall_certificate():
    rng = random.Random(77)
    seen = 0
    for _ in range(400):
        C, allowed, pen = random_case(rng)
        if pen is not None:
            continue
        best, _ = opt_with_deferral(C, allowed, None)
        if best != float("inf"):
            continue
        seen += 1
        res = ex3.dispatch(C, allowed, None)
        assert not res.feasible and res.total == float("inf")
        assert res.hall is not None
        S, N = res.hall
        assert hall_violation_ok(allowed, set(S), set(N)), f"Hall 证书无效：S={S}, N={N}"
    assert seen > 20


def test_no_huge_totals_and_no_inf_passed():
    """无解时不能返回一个含 M 的“解”；有解时 total 不会大过 n × 最大代价。"""
    C = np.array([[5.0, 9.0], [7.0, 3.0]])
    allowed = np.array([[True, False], [True, False]])        # 任务 T2 没有任何可用车
    res = ex3.dispatch(C, allowed)
    assert not res.feasible and res.total == float("inf")
    assert res.hall is not None and set(res.hall[0]) == {1} and set(res.hall[1]) == set()


def test_default_scenario_examples():
    from warehouse import default_costs
    C = default_costs()
    res = ex3.dispatch(C)
    assert res.feasible and res.total == 124
    # 只有 4 辆车（去掉 V5、V6），5 个任务，延后罚金 60：至少延后 1 个，总时间与暴力枚举一致
    res = ex3.dispatch(C[:4], penalty=60)
    best, _ = opt_with_deferral(C[:4], None, 60)
    assert res.feasible and len(res.deferred) >= 1 and abs(res.total - best) < 1e-9
    # 2 楼的车不能跨层 → 3 个 2 楼任务只有 V4、V5 可用：Hall 证书
    lift = np.array([[0, 1, 0, 1, 1], [0, 1, 0, 1, 1], [0, 1, 0, 1, 1], [1, 0, 1, 0, 0], [1, 0, 1, 0, 0], [0, 1, 0, 1, 1]])
    res = ex3.dispatch(C, allowed=(lift == 0))
    assert not res.feasible
    S, N = res.hall
    assert set(S) == {1, 3, 4} and set(N) == {3, 4}


def test_penalty_caps_task_price():
    """罚金很低时，所有任务都会被延后；罚金很高时，等价于不允许延后。"""
    from warehouse import default_costs
    C = default_costs()
    low = ex3.dispatch(C, penalty=1)
    assert len(low.deferred) == 5 and low.total == 5
    high = ex3.dispatch(C, penalty=10_000)
    assert high.deferred == [] and high.total == 124
