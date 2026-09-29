"""练习 1 参考答案"""
from network import INF

PREDICTION = {
    "dijkstra_neg": "WRONG", "bellman_neg": "RIGHT", "johnson_neg": "RIGHT", "dijkstra_negcycle": "WRONG",
}


def dijkstra(n, arcs, s):
    if any(a[3] < 0 for a in arcs):
        raise ValueError("Dijkstra 不接受负费用的弧")
    dist = [INF] * n
    pred = [-1] * n
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
        for k, (a, b, _, w) in enumerate(arcs):
            if a == u and not done[b] and dist[u] + w < dist[b]:
                dist[b] = dist[u] + w
                pred[b] = k
    return dist, pred


def bellman_ford(n, arcs, s):
    dist = [INF] * n
    pred = [-1] * n
    dist[s] = 0
    for _ in range(n - 1):
        changed = False
        for k, (a, b, _, w) in enumerate(arcs):
            if dist[a] < INF and dist[a] + w < dist[b]:
                dist[b] = dist[a] + w
                pred[b] = k
                changed = True
        if not changed:
            break
    for k, (a, b, _, w) in enumerate(arcs):
        if dist[a] < INF and dist[a] + w < dist[b]:
            v = b
            pred[b] = k
            for _ in range(n):
                v = arcs[pred[v]][0]
            cyc = [v]
            x = arcs[pred[v]][0]
            while x != v:
                cyc.append(x)
                x = arcs[pred[x]][0]
            return dist, pred, cyc[::-1]
    return dist, pred, None


def johnson(n, arcs, s):
    """返回 (dist, h)；有负环时返回 (None, None)。"""
    ext = list(arcs) + [(n, v, 0, 0) for v in range(n)]
    d0, _, cyc = bellman_ford(n + 1, ext, n)
    if cyc is not None:
        return None, None
    h = d0[:n]
    red = [(u, v, c, w + h[u] - h[v]) for (u, v, c, w) in arcs]
    d, _ = dijkstra(n, red, s)
    return [x if x == INF else x - h[s] + h[v] for v, x in enumerate(d)], h


def path_to(arcs, pred, t):
    path, v = [], t
    while pred[v] >= 0:
        path.append(pred[v])
        v = arcs[pred[v]][0]
    return path[::-1]
