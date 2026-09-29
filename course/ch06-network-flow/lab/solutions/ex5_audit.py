"""练习 5 参考答案"""
import random

from network import random_network
from oracle import max_flow_value


def _instances():
    rng = random.Random(6606)
    out = []
    for i in range(160):
        n = rng.randint(4, 8)
        net = random_network(rng, n=n, m=rng.randint(n, 2 * n), max_cap=rng.randint(1, 6))
        out.append(net)
    # 手造的陷阱：最短增广路会抢走共享弧 3→5，必须靠回退弧 3→2 改回来
    out.append((6, [(0, 2, 1, 5), (2, 3, 1, 7), (4, 3, 1, 5), (0, 4, 1, 6), (3, 5, 1, 8), (1, 5, 1, 2), (2, 1, 1, 2)]))
    # 汇点不可达
    out.append((4, [(0, 1, 3, 0), (1, 2, 2, 0)]))
    out.append((3, [(0, 1, 3, 0)]))
    return out


def audit(fn) -> set:
    codes = set()
    for n, arcs in _instances():
        s, t = 0, n - 1
        opt = max_flow_value(n, arcs, s, t)
        try:
            r = fn(n, list(arcs), s, t)
            flow, value, cut = list(r["flow"]), r["value"], r.get("cut")
        except Exception:
            codes.add("CRASH")
            continue
        bal = [0] * n
        cap_ok = True
        for k, (u, v, c, _) in enumerate(arcs):
            if flow[k] < -1e-9 or flow[k] > c + 1e-9:
                cap_ok = False
            bal[u] -= flow[k]
            bal[v] += flow[k]
        if not cap_ok:
            codes.add("VIOLATES_CAP")
        if any(abs(bal[v]) > 1e-9 for v in range(n) if v not in (s, t)):
            codes.add("VIOLATES_CONSERVATION")
        if cap_ok and all(abs(bal[v]) <= 1e-9 for v in range(n) if v not in (s, t)):
            if abs(bal[t] - value) > 1e-9:
                codes.add("WRONG_VALUE")
            if bal[t] < opt - 1e-9:
                codes.add("NOT_MAX")
        if cut is not None:
            if s not in cut or t in cut or sum(c for (u, v, c, _) in arcs if u in cut and v not in cut) != opt:
                codes.add("BAD_CUT")
    return codes
