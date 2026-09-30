"""判分用的独立参考实现：暴力枚举。"""
import itertools


def evaluate(p, w, d, seq):
    t = 0
    out = {"sumC": 0, "sumwC": 0, "Lmax": float("-inf"), "sumU": 0}
    for j in seq:
        t += p[j]
        out["sumC"] += t
        out["sumwC"] += w[j] * t
        out["Lmax"] = max(out["Lmax"], t - d[j])
        out["sumU"] += t > d[j]
    return out


def best_values(p, w, d):
    best = {}
    for seq in itertools.permutations(range(len(p))):
        e = evaluate(p, w, d, seq)
        for k, v in e.items():
            if k not in best or v < best[k]:
                best[k] = v
    return best


def opt_cmax_identical(p, m):
    n = len(p)
    return min(max(sum(p[j] for j in range(n) if a[j] == i) for i in range(m)) for a in itertools.product(range(m), repeat=n))
