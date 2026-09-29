import random

import numpy as np
from scipy.optimize import linprog

from labtarget import load
from warehouse import default_costs

ch = load("challenge_lagrange")


def lp_value(C, e1, e2):
    m, n = C.shape
    Aeq, Aub = [], []
    for j in range(n):
        r = np.zeros((m, n)); r[:, j] = 1; Aeq.append(r.ravel())
    for i in range(m):
        r = np.zeros((m, n)); r[i, :] = 1; Aub.append(r.ravel())
    r = np.zeros((m, n)); r[e1] = 1; r[e2] = 1; Aub.append(r.ravel())
    res = linprog(C.ravel(), A_eq=np.array(Aeq), b_eq=np.ones(n), A_ub=np.array(Aub), b_ub=np.ones(m + 1),
                  bounds=(0, 1), method="highs")
    return res.fun


def test_default_pair():
    C = default_costs()
    lam, L = ch.conflict_bound(C, (0, 2), (1, 1))         # V1→T3 与 V2→T2
    assert abs(L - 128) < 1e-6 and abs(lam - 4) < 1e-6
    lam, L = ch.conflict_bound(C, (1, 1), (4, 4))         # V2→T2 与 V5→T5
    assert abs(L - 130) < 1e-6 and abs(lam - 6) < 1e-6     # 124 + λ = 136 − λ → λ = 6


def test_matches_lp_on_random_instances():
    rng = random.Random(99)
    for _ in range(40):
        n = rng.randint(2, 5)
        m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(1, 40) for _ in range(n)] for _ in range(m)], float)
        i1, i2 = rng.sample(range(m), 2)
        j1, j2 = rng.sample(range(n), 2)
        lam, L = ch.conflict_bound(C, (i1, j1), (i2, j2))
        assert lam >= -1e-9
        assert abs(L - lp_value(C, (i1, j1), (i2, j2))) < 1e-6


def test_no_binding_conflict_gives_zero_price():
    """两条边不同时出现在最优派法里：冲突不起作用，λ* = 0，下界就是原来的最优值。"""
    C = default_costs()
    lam, L = ch.conflict_bound(C, (0, 0), (1, 2))          # V1→T1 与 V2→T3：都不在最优派法里
    assert abs(lam) < 1e-6 and abs(L - 124) < 1e-6
