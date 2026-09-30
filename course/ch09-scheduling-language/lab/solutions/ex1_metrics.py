"""练习 1 参考答案"""
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
        if L > 0:
            out["sumU"] += 1
            out["sumwU"] += w[j]
    out["Cmax"] = t
    return out


def best_by(p, w, d, r):
    """枚举全部顺序。返回 {目标: (最小值, 取得最小值的第一个顺序)}，顺序按 itertools.permutations 的字典序。"""
    best = {}
    for seq in itertools.permutations(range(len(p))):
        e = evaluate(p, w, d, r, seq)
        for k in KEYS:
            if k not in best or e[k] < best[k][0]:
                best[k] = (e[k], seq)
    return best
