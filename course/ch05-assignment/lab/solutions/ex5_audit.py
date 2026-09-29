"""练习 5 参考答案。"""
import random

import numpy as np

from oracle import opt_with_deferral


def _instances():
    rng = random.Random(4242)
    out = []
    for _ in range(300):
        m = rng.randint(1, 5)
        n = rng.randint(1, 5)
        C = np.array([[rng.randint(1, 40) for _ in range(n)] for _ in range(m)], float)
        p_allow = rng.choice((1.0, 0.8, 0.6))
        allowed = np.array([[rng.random() < p_allow for _ in range(n)] for _ in range(m)])
        kind = rng.choice(("none", "scalar", "array"))
        if kind == "none":
            pen = None
        elif kind == "scalar":
            pen = float(rng.randint(5, 80))
        else:
            pen = np.array([rng.randint(5, 80) for _ in range(n)], float)
        out.append((C, allowed, pen))
    return out


def audit(fn) -> set:
    codes = set()
    for C, allowed, pen in _instances():
        m, n = C.shape
        best, _ = opt_with_deferral(C, allowed, pen)
        try:
            res = fn(C, allowed, pen)
        except Exception:
            codes.add("CRASH")
            continue
        if not res["feasible"]:
            if best != float("inf"):
                codes.add("FALSE_INFEASIBLE")
            continue
        assign = list(res["assign"])
        if best == float("inf"):
            # 真的无解，函数却给出了“解”：除了 FALSE_FEASIBLE，再看它是怎么“凑”出来的
            codes.add("FALSE_FEASIBLE")
            if allowed is not None and any(i is not None and not allowed[i][j] for j, i in enumerate(assign)):
                codes.add("USES_FORBIDDEN")
            if pen is None and (len(assign) != n or any(i is None for i in assign)):
                codes.add("TASKS_DROPPED")
            continue
        if len(assign) != n:
            codes.add("TASKS_DROPPED")
            continue
        forbidden = any(i is not None and not allowed[i][j] for j, i in enumerate(assign))
        if forbidden:
            codes.add("USES_FORBIDDEN")
        if pen is None and any(i is None for i in assign):
            codes.add("TASKS_DROPPED")
            continue
        penv = None if pen is None else np.broadcast_to(np.asarray(pen, float), (n,))
        real = sum(float(C[i][j]) if i is not None else float(penv[j]) for j, i in enumerate(assign))
        if abs(real - res["total"]) > 1e-6:
            codes.add("WRONG_TOTAL")
        used = [i for i in assign if i is not None]
        if len(used) != len(set(used)):
            codes.add("USES_FORBIDDEN")     # 一辆车被派了两次也算非法派法
        if not forbidden and real > best + 1e-6:
            codes.add("NOT_OPTIMAL")
    return codes
