"""练习 5 参考答案"""
import random

from instances import random_jobs
from oracle import best_values, evaluate

KEYS = ["sumC", "sumwC", "Lmax", "sumU"]


def _instances():
    rng = random.Random(1010)
    out = [random_jobs(rng, n=rng.randint(2, 6)) for _ in range(80)]
    out.append(([4], [2], [3]))
    return out


def audit(fn) -> set:
    codes = set()
    for p, w, d in _instances():
        try:
            got = fn(p, w, d)
        except Exception:
            codes.add("CRASH")
            continue
        best = best_values(p, w, d)
        for k in KEYS:
            seq = got.get(k)
            if seq is None or sorted(seq) != list(range(len(p))):
                codes.add("BAD_" + k.upper())
            elif evaluate(p, w, d, seq)[k] > best[k] + 1e-9:
                codes.add("BAD_" + k.upper())
    return codes
