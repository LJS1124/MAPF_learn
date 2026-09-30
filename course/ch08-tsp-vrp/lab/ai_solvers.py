"""练习 5 的材料：5 个“AI 写的”旅行商函数。它们都能跑，但每个都有一个问题。

接口：fn(D) -> {"tour": [点的顺序，从仓库 0 出发], "length": 汇报的回路总长（含回到仓库）}
D 是 n×n 的距离矩阵，点 0 是仓库。请不要修改这个文件。audit 要在不看源码的前提下，只靠运行结果把问题查出来。
"""
import itertools


def _len(D, tour):
    return sum(D[tour[i]][tour[(i + 1) % len(tour)]] for i in range(len(tour)))


def ai_a(D):
    """AI-A：枚举全部排列，取最短的，汇报路线长度。"""
    n = len(D)
    best = min(itertools.permutations(range(1, n)), key=lambda p: sum(D[a][b] for a, b in zip((0,) + p, p)))
    tour = [0] + list(best)
    return {"tour": tour, "length": sum(D[tour[i]][tour[i + 1]] for i in range(n - 1))}


def ai_b(D):
    """AI-B：最近邻，每次去离当前点最近的没去过的点。"""
    n = len(D)
    tour, used = [0], {0}
    while len(tour) < n:
        cur = tour[-1]
        nxt = min((j for j in range(n) if j not in used), key=lambda j: D[cur][j])
        tour.append(nxt)
        used.add(nxt)
    return {"tour": tour, "length": _len(D, tour)}


def ai_c(D):
    """AI-C：贪心加弧，每次加最短的、不会让某点度数超过 2 的边。"""
    n = len(D)
    if n <= 2:
        t = list(range(n))
        return {"tour": t, "length": _len(D, t)}
    edges = sorted((D[i][j], i, j) for i in range(n) for j in range(i + 1, n))
    deg, adj = [0] * n, {i: [] for i in range(n)}
    for w, i, j in edges:
        if deg[i] < 2 and deg[j] < 2:
            adj[i].append(j)
            adj[j].append(i)
            deg[i] += 1
            deg[j] += 1
    tour, prev, cur = [0], -1, 0
    while len(tour) < n:
        nxts = [v for v in adj[cur] if v != prev and v not in tour]
        if not nxts:
            break
        prev, cur = cur, nxts[0]
        tour.append(cur)
    return {"tour": tour, "length": _len(D, tour)}


def ai_d(D):
    """AI-D：枚举全部排列，路线固定从点 1 出发（“反正是环，从哪里开始都一样”）。"""
    n = len(D)
    if n <= 2:
        t = list(range(n))
        return {"tour": t, "length": _len(D, t)}
    best = min(itertools.permutations(range(2, n)), key=lambda p: _len(D, [1] + list(p) + [0]))
    tour = [1] + list(best) + [0]
    return {"tour": tour, "length": _len(D, tour)}


def ai_e(D):
    """AI-E：枚举全部排列，取最短的；顺手记下离仓库最近的客户，用来打印日志。"""
    n = len(D)
    nearest = min(D[0][1:])
    best = min(itertools.permutations(range(1, n)), key=lambda p: _len(D, [0] + list(p)))
    tour = [0] + list(best)
    return {"tour": tour, "length": _len(D, tour)}


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "WRONG_LENGTH", "AI-B": "NOT_OPTIMAL", "AI-C": "NOT_HAMILTONIAN", "AI-D": "NOT_FROM_DEPOT", "AI-E": "CRASH"}
