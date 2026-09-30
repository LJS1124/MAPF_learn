"""练习 4 参考答案"""
import math

from labtarget import load


def route_length(D, route):
    """route 是不含仓库的客户顺序；仓库 → 客户... → 仓库。"""
    if not route:
        return 0
    path = [0] + list(route) + [0]
    return sum(D[path[i]][path[i + 1]] for i in range(len(path) - 1))


def check_routes(D, dem, Q, K, routes):
    """返回 (合法, 总长)：每个客户恰好出现一次，每条路线需求不超 Q，路线数不超 K。"""
    m = len(dem)
    seen = sorted(c for r in routes for c in r)
    if seen != list(range(1, m + 1)) or len(routes) > K:
        return False, None
    if any(sum(dem[c - 1] for c in r) > Q for r in routes):
        return False, None
    return True, sum(route_length(D, r) for r in routes)


def cvrp_opt(D, dem, Q, K):
    hk = load("ex1_tsp").held_karp
    m = len(dem)
    INF = float("inf")
    full = (1 << m) - 1
    cost = [INF] * (full + 1)
    cost[0] = 0
    for mask in range(1, full + 1):
        nodes = [i + 1 for i in range(m) if mask >> i & 1]
        if sum(dem[c - 1] for c in nodes) > Q:
            continue
        sub = [0] + nodes
        Ds = [[D[a][b] for b in sub] for a in sub]
        cost[mask] = hk(Ds)[0]
    dp = [[INF] * (full + 1) for _ in range(K + 1)]
    ch = [[0] * (full + 1) for _ in range(K + 1)]
    dp[0][0] = 0
    for k in range(1, K + 1):
        for mask in range(full + 1):
            dp[k][mask] = dp[k - 1][mask]
            if mask == 0:
                continue
            low = mask & -mask
            sub = mask
            while sub:
                if sub & low and cost[sub] < INF and dp[k - 1][mask ^ sub] + cost[sub] < dp[k][mask]:
                    dp[k][mask] = dp[k - 1][mask ^ sub] + cost[sub]
                    ch[k][mask] = sub
                sub = (sub - 1) & mask
    if dp[K][full] == INF:
        return None, []
    routes, cur = [], full
    for k in range(K, 0, -1):
        s = ch[k][cur]
        if s:
            nodes = [i + 1 for i in range(m) if s >> i & 1]
            sub = [0] + nodes
            Ds = [[D[a][b] for b in sub] for a in sub]
            t = hk(Ds)[1]
            routes.append([nodes[i - 1] for i in t[1:]])
            cur ^= s
    return dp[K][full], routes


def sweep(P, D, dem, Q):
    """扫描法：客户按相对仓库的极角 atan2(dy, dx) 从小到大排序（角度相同按编号），依次装车，装不下就换新车；
    每组用 held_karp 排最优路线。返回 (总长, 路线列表)，路线不含仓库。"""
    hk = load("ex1_tsp").held_karp
    m = len(dem)
    order = sorted(range(1, m + 1), key=lambda c: (math.atan2(P[c][1] - P[0][1], P[c][0] - P[0][0]), c))
    groups, load_ = [[]], 0
    for c in order:
        if load_ + dem[c - 1] > Q:
            groups.append([])
            load_ = 0
        groups[-1].append(c)
        load_ += dem[c - 1]
    routes = []
    for g in groups:
        sub = [0] + g
        Ds = [[D[a][b] for b in sub] for a in sub]
        t = hk(Ds)[1]
        routes.append([g[i - 1] for i in t[1:]])
    return sum(route_length(D, r) for r in routes), routes
