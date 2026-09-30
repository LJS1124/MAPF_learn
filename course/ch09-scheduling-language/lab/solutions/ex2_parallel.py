"""练习 2 参考答案"""
import itertools


def list_schedule(P, order):
    m = len(P)
    load = [0] * m
    assign = {}
    for j in order:
        i = min(range(m), key=lambda i: (load[i] + P[i][j], i))
        load[i] += P[i][j]
        assign[j] = i
    return max(load), assign, load


def opt_cmax(P):
    m, n = len(P), len(P[0])
    best = (float("inf"), None)
    for a in itertools.product(range(m), repeat=n):
        c = max(sum(P[i][j] for j in range(n) if a[j] == i) for i in range(m))
        if c < best[0]:
            best = (c, list(a))
    return best


def lower_bound_identical(p, m):
    return max(max(p), sum(p) / m)
