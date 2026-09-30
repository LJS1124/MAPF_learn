"""挑战参考答案"""


def js_dispatch(jobs):
    """返回 (最大完工时间, orders)：orders[m] 是机器 m 上作业的加工顺序。"""
    nj = len(jobs)
    nxt = [0] * nj
    ready = [0] * nj
    mfree = {}
    orders = {}
    remaining = sum(len(j) for j in jobs)
    while remaining:
        best = None
        for j in range(nj):
            if nxt[j] >= len(jobs[j]):
                continue
            m, d = jobs[j][nxt[j]]
            s = max(ready[j], mfree.get(m, 0))
            key = (s, d, j)
            if best is None or key < best[0]:
                best = (key, j, m, d, s)
        _, j, m, d, s = best
        orders.setdefault(m, []).append(j)
        ready[j] = mfree[m] = s + d
        nxt[j] += 1
        remaining -= 1
    return max(ready), orders
