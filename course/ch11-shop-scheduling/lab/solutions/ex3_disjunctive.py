"""练习 3 参考答案"""


def js_makespan(jobs, orders):
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
