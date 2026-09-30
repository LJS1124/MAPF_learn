"""练习 4 参考答案"""


def lpt_order(p):
    return sorted(range(len(p)), key=lambda j: (-p[j], j))


def list_cmax(p, m, order):
    load = [0] * m
    for j in order:
        i = min(range(m), key=lambda i: (load[i] + p[j], i))
        load[i] += p[j]
    return max(load)


def worst_list_instance(m):
    p = [1] * (m * (m - 1)) + [m]
    return p, list(range(len(p))), m


def lpt_worst_instance(m):
    p = []
    for v in range(2 * m - 1, m, -1):
        p += [v, v]
    p += [m, m, m]
    return p, lpt_order(p), 3 * m


def mcnaughton(p, m):
    tot = sum(p)
    C = max(max(p), tot / m)
    slots = [[] for _ in range(m)]
    i, t = 0, 0.0
    for j, x in enumerate(p):
        rest = float(x)
        while rest > 1e-9:
            take = min(rest, C - t)
            slots[i].append((j, t, t + take))
            t += take
            rest -= take
            if C - t < 1e-9 and i < m - 1:
                i += 1
                t = 0.0
    return C, slots
