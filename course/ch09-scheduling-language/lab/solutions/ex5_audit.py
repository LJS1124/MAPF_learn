"""练习 5 参考答案"""
import random

from instances import random_jobs
from oracle import KEYS, evaluate


def _instances():
    rng = random.Random(9909)
    out = []
    for k in range(120):
        p, w, d, r = random_jobs(rng, n=rng.randint(2, 6), releases=(k % 2 == 1))
        seq = list(range(len(p)))
        rng.shuffle(seq)
        out.append((p, w, d, r, seq))
    out.append(([4], [2], [3], [0], [0]))       # 只有一个作业
    return out


def audit(fn) -> set:
    codes = set()
    for p, w, d, r, seq in _instances():
        ref = evaluate(p, w, d, r, seq)
        try:
            got = fn(p, w, d, r, list(seq))
        except Exception:
            codes.add("CRASH")
            continue
        for k in KEYS:
            if k not in got or abs(got[k] - ref[k]) > 1e-9:
                # 没有释放时间的实例上也错：这个目标的公式本身有问题；只在有释放时间的实例上错：忽略了释放时间
                codes.add("BAD_" + k.upper() if not any(r) else "IGNORES_RELEASE")
    return codes
