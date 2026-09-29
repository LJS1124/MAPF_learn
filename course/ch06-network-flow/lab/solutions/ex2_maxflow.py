"""练习 2 参考答案"""
from collections import deque


def max_flow(n, arcs, s, t, rule="bfs"):
    m = len(arcs)
    cap = [0] * (2 * m)
    adj = [[] for _ in range(n)]
    for k, (u, v, c, _) in enumerate(arcs):
        cap[2 * k] = c
        adj[u].append(2 * k)
        adj[v].append(2 * k + 1)
    head = lambda a: arcs[a // 2][1] if a % 2 == 0 else arcs[a // 2][0]

    def find():
        par = [-1] * n
        seen = [False] * n
        seen[s] = True
        if rule == "dfs":
            def dfs(u):
                if u == t:
                    return True
                for a in sorted(adj[u], key=head):
                    v = head(a)
                    if cap[a] > 0 and not seen[v]:
                        seen[v] = True
                        par[v] = a
                        if dfs(v):
                            return True
                return False
            dfs(s)
        else:
            q = deque([s])
            while q:
                u = q.popleft()
                for a in adj[u]:
                    v = head(a)
                    if cap[a] > 0 and not seen[v]:
                        seen[v] = True
                        par[v] = a
                        q.append(v)
        if not seen[t]:
            return None, seen
        path, v = [], t
        while v != s:
            path.append(par[v])
            v = head(par[v] ^ 1)
        return path[::-1], seen

    value = paths = 0
    while True:
        path, seen = find()
        if path is None:
            break
        b = min(cap[a] for a in path)
        for a in path:
            cap[a] -= b
            cap[a ^ 1] += b
        value += b
        paths += 1
    return {"value": value, "flow": [cap[2 * k + 1] for k in range(m)], "cut": {v for v in range(n) if seen[v]}, "paths": paths}
