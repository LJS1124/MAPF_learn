"""挑战参考答案"""
import itertools


def pareto(p, d):
    n = len(p)
    pts = set()
    for seq in itertools.permutations(range(n)):
        t, sc, lm = 0, 0, float("-inf")
        for j in seq:
            t += p[j]
            sc += t
            lm = max(lm, t - d[j])
        pts.add((sc, lm))
    front, best = [], float("inf")
    for c, l in sorted(pts, key=lambda q: (q[1], q[0])):
        if c < best:
            front.append((c, l))
            best = c
    return front
