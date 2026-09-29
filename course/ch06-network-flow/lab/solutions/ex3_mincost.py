"""练习 3 参考答案：逐次最短路，带势"""
from network import INF


def min_cost_flow(n, arcs, s, t, k=None):
    m = len(arcs)
    cap = [0] * (2 * m)
    cost = [0] * (2 * m)
    adj = [[] for _ in range(n)]
    for e, (u, v, c, w) in enumerate(arcs):
        cap[2 * e], cost[2 * e] = c, w
        cost[2 * e + 1] = -w
        adj[u].append(2 * e)
        adj[v].append(2 * e + 1)
    head = lambda a: arcs[a // 2][1] if a % 2 == 0 else arcs[a // 2][0]
    pi = [0] * n
    # 负费用（无负环）时先用 Bellman–Ford 算初始势
    if any(a[3] < 0 for a in arcs):
        d = [0] * n
        for _ in range(n):
            for e, (u, v, _, w) in enumerate(arcs):
                if d[u] + w < d[v]:
                    d[v] = d[u] + w
        pi = d                       # w + d[u] - d[v] >= 0
    value = total = 0
    while k is None or value < k:
        dist = [INF] * n
        par = [-1] * n
        done = [False] * n
        dist[s] = 0
        for _ in range(n):
            u = -1
            for i in range(n):
                if not done[i] and dist[i] < INF and (u < 0 or dist[i] < dist[u]):
                    u = i
            if u < 0:
                break
            done[u] = True
            for a in adj[u]:
                v = head(a)
                if cap[a] > 0 and not done[v]:
                    nd = dist[u] + cost[a] + pi[u] - pi[v]
                    if nd < dist[v]:
                        dist[v], par[v] = nd, a
        if dist[t] >= INF:
            break
        for v in range(n):
            if dist[v] < INF:
                pi[v] += dist[v]
        path, v = [], t
        while v != s:
            path.append(par[v])
            v = head(par[v] ^ 1)
        b = min(cap[a] for a in path)
        if k is not None:
            b = min(b, k - value)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
        value += b
        total += b * sum(cost[a] for a in path)
    # 证书：在最终残量图上重算一组势（虚拟源 + Bellman–Ford），保证每条残量弧的约化成本 >= 0
    pi = [0] * n
    for _ in range(n + 1):
        for a in range(2 * m):
            if cap[a] > 0 and pi[head(a ^ 1)] + cost[a] < pi[head(a)]:
                pi[head(a)] = pi[head(a ^ 1)] + cost[a]
    return {"value": value, "cost": total, "flow": [cap[2 * e + 1] for e in range(m)], "pi": pi}


def cost_curve(n, arcs, s, t):
    """k = 0, 1, ..., 最大流 对应的最小费用。"""
    full = min_cost_flow(n, arcs, s, t)
    return [min_cost_flow(n, arcs, s, t, k)["cost"] for k in range(full["value"] + 1)]
