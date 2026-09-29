"""生成对拍夹具 page/tests/fixtures.json：由 SciPy、暴力枚举和 linprog 算出的期望值，供 core5.js 的 Node 测试逐项核对。

用法：python3 tools/gen_fixtures.py
"""
import itertools
import json
import pathlib
import random
import sys

import numpy as np
from scipy.optimize import linear_sum_assignment, linprog

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "lab"))
from oracle import opt_bottleneck, opt_lexicographic, opt_with_deferral, pareto_front  # noqa: E402
from solutions.challenge_lagrange import conflict_bound  # noqa: E402
from families import FAMILIES, BASE  # noqa: E402


def lsa_opt(C, cols):
    S = np.asarray(C, float)[:, cols]
    r, c = linear_sum_assignment(S)
    return float(S[r, c].sum())


def hist_of(A):
    A = np.asarray(A)
    R, Cn = A.shape
    h = {}
    for k in range(1, min(R, Cn) + 1):
        cols = list(itertools.combinations(range(Cn), k))
        for rows in itertools.combinations(range(R), k):
            sub = A[list(rows)]
            for cc in cols:
                d = int(round(np.linalg.det(sub[:, list(cc)])))
                h[str(d)] = h.get(str(d), 0) + 1
    return h


def lp_conflict(C, e1, e2):
    m, n = C.shape
    Aeq, Aub = [], []
    for j in range(n):
        r = np.zeros((m, n)); r[:, j] = 1; Aeq.append(r.ravel())
    for i in range(m):
        r = np.zeros((m, n)); r[i, :] = 1; Aub.append(r.ravel())
    r = np.zeros((m, n)); r[e1] = 1; r[e2] = 1; Aub.append(r.ravel())
    res = linprog(C.ravel(), A_eq=np.array(Aeq), b_eq=np.ones(n), A_ub=np.array(Aub), b_ub=np.ones(m + 1), bounds=(0, 1), method="highs")
    return float(res.fun)


def main():
    rng = random.Random(20260929)
    fx = {"incremental": [], "dispatch": [], "bottleneck": [], "conflict": [], "tu": {}, "lagrange": []}
    for _ in range(250):
        n = rng.randint(1, 8); m = rng.randint(n, n + 3)
        C = [[rng.randint(0, 40) for _ in range(n)] for _ in range(m)]
        order = list(range(n)); rng.shuffle(order)
        fx["incremental"].append({"C": C, "order": order, "prefix": [lsa_opt(C, order[:k + 1]) for k in range(n)]})
    for _ in range(400):
        m = rng.randint(1, 5); n = rng.randint(1, 5)
        C = np.array([[rng.randint(1, 40) for _ in range(n)] for _ in range(m)], float)
        p_allow = rng.choice((1.0, 0.85, 0.6))
        allowed = np.array([[rng.random() < p_allow for _ in range(n)] for _ in range(m)])
        kind = rng.choice(("none", "scalar", "array"))
        pen = None if kind == "none" else (float(rng.randint(5, 80)) if kind == "scalar" else [float(rng.randint(5, 80)) for _ in range(n)])
        best, _ = opt_with_deferral(C, allowed, pen)
        fx["dispatch"].append({"C": C.tolist(), "allowed": allowed.tolist(), "penalty": pen, "best": None if best == float("inf") else best})
    for _ in range(200):
        n = rng.randint(1, 5); m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(1, 30) for _ in range(n)] for _ in range(m)], float)
        tau, _ = opt_bottleneck(C)
        _, tot, _ = opt_lexicographic(C)
        fx["bottleneck"].append({"C": C.tolist(), "tau": tau, "lex_total": tot, "pareto": [list(p) for p in pareto_front(C)]})
    from oracle import all_assignments, total  # noqa: E402
    for _ in range(60):
        n = rng.randint(2, 5); m = rng.randint(n, n + 2)
        C = np.array([[rng.randint(1, 40) for _ in range(n)] for _ in range(m)], float)
        i1, i2 = rng.sample(range(m), 2); j1, j2 = rng.sample(range(n), 2)
        ip = min(total(C, a) for a in all_assignments(m, n) if (a[j1] == i1) + (a[j2] == i2) <= 1)
        lam, L = conflict_bound(C, (i1, j1), (i2, j2))
        fx["conflict"].append({"C": C.tolist(), "e1": [i1, j1], "e2": [i2, j2], "lp": lp_conflict(C, (i1, j1), (i2, j2)), "ip": float(ip)})
        fx["lagrange"].append({"C": C.tolist(), "e1": [i1, j1], "e2": [i2, j2], "L": float(L)})
    fam = dict(FAMILIES); fam["base"] = BASE
    for name, A in fam.items():
        fx["tu"][name] = hist_of(A)
    out = ROOT / "page" / "tests" / "fixtures.json"
    out.write_text(json.dumps(fx), encoding="utf-8")
    print("wrote", out, {k: (len(v) if hasattr(v, '__len__') else v) for k, v in fx.items()})


if __name__ == "__main__":
    main()
