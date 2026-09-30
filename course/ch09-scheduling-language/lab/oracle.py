"""判分用的独立参考实现：暴力枚举。"""
import itertools

KEYS = ["Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"]


def evaluate(p, w, d, r, seq):
    t = 0
    out = {k: 0 for k in KEYS}
    out["Lmax"] = float("-inf")
    for j in seq:
        t = max(t, r[j]) + p[j]
        L = t - d[j]
        out["sumC"] += t
        out["sumwC"] += w[j] * t
        out["Lmax"] = max(out["Lmax"], L)
        out["sumT"] += max(0, L)
        out["sumU"] += 1 if L > 0 else 0
        out["sumwU"] += w[j] if L > 0 else 0
    out["Cmax"] = t
    return out


def best_values(p, w, d, r):
    best = {}
    for seq in itertools.permutations(range(len(p))):
        e = evaluate(p, w, d, r, seq)
        for k in KEYS:
            if k not in best or e[k] < best[k]:
                best[k] = e[k]
    return best


def opt_cmax(P):
    """每个作业去哪台机器（同一台上的顺序不影响 Cmax）。"""
    m, n = len(P), len(P[0])
    return min(max(sum(P[i][j] for j in range(n) if a[j] == i) for i in range(m)) for a in itertools.product(range(m), repeat=n))


def pareto_ref(p, d):
    pts = set()
    for seq in itertools.permutations(range(len(p))):
        e = evaluate(p, [1] * len(p), d, [0] * len(p), seq)
        pts.add((e["sumC"], e["Lmax"]))
    front, best_c = [], float("inf")
    for c, l in sorted(pts, key=lambda q: (q[1], q[0])):
        if c < best_c:
            front.append((c, l))
            best_c = c
    return front
