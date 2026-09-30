"""练习 5 参考答案"""
import random

from instances import dist, random_points
from oracle import tsp_brute


def _instances():
    rng = random.Random(8808)
    out = [dist(random_points(rng, n=rng.randint(3, 7))) for _ in range(80)]
    out.append([[0]])                        # 只有仓库
    out.append([[0, 5], [5, 0]])             # 一个客户
    return out


def audit(fn) -> set:
    codes = set()
    for D in _instances():
        n = len(D)
        try:
            r = fn(D)
            tour, length = list(r["tour"]), r["length"]
        except Exception:
            codes.add("CRASH")
            continue
        if sorted(tour) != list(range(n)):
            codes.add("NOT_HAMILTONIAN")
            continue
        if tour[0] != 0:
            codes.add("NOT_FROM_DEPOT")
        real = sum(D[tour[i]][tour[(i + 1) % n]] for i in range(n)) if n > 1 else 0
        if abs(real - length) > 1e-6:
            codes.add("WRONG_LENGTH")
        if real > tsp_brute(D) + 1e-6:
            codes.add("NOT_OPTIMAL")
    return codes
