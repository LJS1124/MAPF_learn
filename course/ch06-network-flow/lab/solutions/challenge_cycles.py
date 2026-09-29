"""挑战参考答案：循环取消"""


def _neg_cycle(n, res):
    """res: [(u, v, cap, cost, arc, sign)]，只看 cap > 0 的弧。返回残量弧下标组成的环，或 None。"""
    d = [0] * n
    pred = [-1] * n
    x = -1
    for _ in range(n):
        x = -1
        for i, (u, v, c, w, _, _) in enumerate(res):
            if c > 0 and d[u] + w < d[v]:
                d[v] = d[u] + w
                pred[v] = i
                x = v
        if x < 0:
            return None
    for _ in range(n):
        x = res[pred[x]][0]
    cyc, v = [], x
    while True:
        cyc.append(pred[v])
        v = res[pred[v]][0]
        if v == x:
            break
    return cyc[::-1]


def cancel_cycles(n, arcs, flow):
    flow = list(flow)
    history = [sum(flow[k] * arcs[k][3] for k in range(len(arcs)))]
    it = 0
    while True:
        res = []
        for k, (u, v, c, w) in enumerate(arcs):
            res.append((u, v, c - flow[k], w, k, 1))
            res.append((v, u, flow[k], -w, k, -1))
        cyc = _neg_cycle(n, res)
        if cyc is None:
            break
        b = min(res[i][2] for i in cyc)
        for i in cyc:
            flow[res[i][4]] += res[i][5] * b
        it += 1
        history.append(sum(flow[k] * arcs[k][3] for k in range(len(arcs))))
    return {"flow": flow, "cost": history[-1], "iterations": it, "history": history}
