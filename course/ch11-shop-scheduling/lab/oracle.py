"""判分用的独立参考实现：暴力枚举。"""
import itertools


def flow_cmax(P, perm):
    m = len(P[0])
    free = [0] * m
    for j in perm:
        prev = 0
        for k in range(m):
            prev = max(free[k], prev) + P[j][k]
            free[k] = prev
    return free[-1]


def enum_flow(P):
    return min(flow_cmax(P, p) for p in itertools.permutations(range(len(P))))


def js_eval(jobs, orders):
    """orders[m] = 机器 m 上的作业顺序。返回最大完工时间；有环（不可行）返回 None。"""
    ops = [(j, k) for j in range(len(jobs)) for k in range(len(jobs[j]))]
    idx = {o: i for i, o in enumerate(ops)}
    dur = [jobs[j][k][1] for j, k in ops]
    succ = [[] for _ in ops]
    indeg = [0] * len(ops)
    for j, job in enumerate(jobs):
        for k in range(len(job) - 1):
            succ[idx[(j, k)]].append(idx[(j, k + 1)])
            indeg[idx[(j, k + 1)]] += 1
    for m, order in orders.items():
        seq = []
        for j in order:
            k = next(k for k, (mm, _) in enumerate(jobs[j]) if mm == m)
            seq.append(idx[(j, k)])
        for a, b in zip(seq, seq[1:]):
            succ[a].append(b)
            indeg[b] += 1
    start = [0] * len(ops)
    stack = [i for i in range(len(ops)) if indeg[i] == 0]
    seen = 0
    while stack:
        u = stack.pop()
        seen += 1
        for v in succ[u]:
            start[v] = max(start[v], start[u] + dur[u])
            indeg[v] -= 1
            if indeg[v] == 0:
                stack.append(v)
    if seen < len(ops):
        return None
    return max(start[i] + dur[i] for i in range(len(ops)))


def js_opt(jobs):
    nm = 1 + max(m for job in jobs for m, _ in job)
    perms = list(itertools.permutations(range(len(jobs))))
    best = None
    for combo in itertools.product(perms, repeat=nm):
        c = js_eval(jobs, {m: combo[m] for m in range(nm)})
        if c is not None and (best is None or c < best):
            best = c
    return best
