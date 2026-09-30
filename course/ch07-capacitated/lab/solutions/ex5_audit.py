"""练习 5 参考答案"""
import random

from instances import random_gap
from oracle import gap_check, gap_ip


def _instances():
    rng = random.Random(7707)
    out = [random_gap(rng, m=rng.randint(2, 4), n=rng.randint(4, 8), slack=(0.9, 1.5)) for _ in range(120)]
    out.append(([[5, 6, 7]], [4, 5, 9], [10]))                 # 一个任务比所有车都重：无解
    out.append(([[5, 6], [7, 8]], [6, 6], [6, 6]))              # 紧：每车恰好一个
    return out


def audit(fn) -> set:
    codes = set()
    for C, w, Q in _instances():
        opt, _ = gap_ip(C, w, Q)
        try:
            r = fn(C, list(w), list(Q))
            feas, assign, total = r["feasible"], r["assign"], r["total"]
        except Exception:
            codes.add("CRASH")
            continue
        if opt is None:
            if feas:
                codes.add("FALSE_FEASIBLE")
            continue
        if not feas:
            codes.add("FALSE_INFEASIBLE")
            continue
        m, n = len(C), len(w)
        if len(assign) != n or any(a is None or not (0 <= a < m) for a in assign):
            codes.add("UNASSIGNED")
            continue
        load = [0] * m
        for j, a in enumerate(assign):
            load[a] += w[j]
        if any(load[i] > Q[i] for i in range(m)):
            codes.add("OVER_CAPACITY")
            continue
        real = sum(C[a][j] for j, a in enumerate(assign))
        if abs(real - total) > 1e-6:
            codes.add("WRONG_TOTAL")
        if real > opt + 1e-6:
            codes.add("NOT_OPTIMAL")
    return codes
