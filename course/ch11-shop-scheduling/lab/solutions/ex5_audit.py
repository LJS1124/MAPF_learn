"""练习 5 参考答案"""
import random

from instances import random_flow
from oracle import flow_cmax


def _instances():
    rng = random.Random(1111)
    out = []
    for k in range(120):
        m = 1 + k % 4
        P = random_flow(rng, n=rng.randint(2, 6), m=m)
        perm = list(range(len(P)))
        rng.shuffle(perm)
        out.append((P, perm))
    out.append(([[3, 4]], [0]))          # 只有一个作业
    return out


def audit(fn) -> set:
    codes = set()
    order_dependent_wrong = order_dependent_total = 0
    for P, perm in _instances():
        m = len(P[0])
        truth = flow_cmax(P, perm)
        try:
            got = fn(P, list(perm))
        except Exception:
            codes.add("CRASH")
            continue
        if got != truth:
            if got == flow_cmax(P, perm[::-1]) and len(perm) > 1 and truth != flow_cmax(P, perm[::-1]):
                codes.add("REVERSED_ORDER")
            elif m >= 3:
                codes.add("WRONG_M3PLUS")
            else:
                codes.add("WRONG_M2")
        if len(perm) >= 3 and truth != flow_cmax(P, perm[::-1]):
            order_dependent_total += 1
            if got == fn(P, list(perm[::-1])):
                order_dependent_wrong += 1
    if order_dependent_total and order_dependent_wrong == order_dependent_total:
        codes.add("ORDER_IGNORED")
    return codes
