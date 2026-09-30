"""练习 1 参考答案"""


def flow_makespan(P, perm):
    m = len(P[0])
    free = [0] * m
    for j in perm:
        prev = 0
        for k in range(m):
            prev = max(free[k], prev) + P[j][k]
            free[k] = prev
    return free[-1]


def johnson(P):
    a1 = sorted([j for j in range(len(P)) if P[j][0] <= P[j][1]], key=lambda j: (P[j][0], j))
    a2 = sorted([j for j in range(len(P)) if P[j][0] > P[j][1]], key=lambda j: (-P[j][1], j))
    return a1 + a2
