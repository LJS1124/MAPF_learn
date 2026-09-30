"""练习 5 的材料：5 个“AI 写的”广义指派求解函数。它们都能跑，但每个都有一个问题。

接口：fn(C, w, Q) -> {"feasible": bool, "assign": [每个任务的车下标], "total": 总行驶时间}
C 是 m×n 行驶时间，w 是 n 个任务的托盘数，Q 是 m 辆车的载重。无解时返回 feasible=False。
请不要修改这个文件。audit 要在不看源码的前提下，只靠运行结果把它们的问题查出来。
"""
import itertools


def _total(C, assign):
    return sum(C[a][j] for j, a in enumerate(assign))


def ai_a(C, w, Q):
    """AI-A：每个任务选最便宜的车。"""
    m, n = len(C), len(w)
    assign = [min(range(m), key=lambda i: C[i][j]) for j in range(n)]
    return {"feasible": True, "assign": assign, "total": _total(C, assign)}


def ai_b(C, w, Q):
    """AI-B：按重量从大到小，每个任务放进放得下的最便宜的车。放不下就报无解。"""
    m, n = len(C), len(w)
    load, assign = [0] * m, [None] * n
    for j in sorted(range(n), key=lambda j: -w[j]):
        cand = [i for i in range(m) if load[i] + w[j] <= Q[i]]
        if not cand:
            return {"feasible": False, "assign": [None] * n, "total": float("inf")}
        i = min(cand, key=lambda i: C[i][j])
        assign[j] = i
        load[i] += w[j]
    return {"feasible": True, "assign": assign, "total": _total(C, assign)}


def ai_c(C, w, Q):
    """AI-C：枚举全部派法，取载重可行的最小费用，汇报“目标值”。"""
    m, n = len(C), len(w)
    best, ba = None, None
    for a in itertools.product(range(m), repeat=n):
        load = [0] * m
        for j, i in enumerate(a):
            load[i] += w[j]
        if all(load[i] <= Q[i] for i in range(m)):
            c = _total(C, a)
            if best is None or c < best:
                best, ba = c, list(a)
    if best is None:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    return {"feasible": True, "assign": ba, "total": best + 1}


def ai_d(C, w, Q):
    """AI-D：枚举全部派法；某车的载重恰好用满（等于载重）时视为“太满，不安全”，不接受。"""
    m, n = len(C), len(w)
    best, ba = None, None
    for a in itertools.product(range(m), repeat=n):
        load = [0] * m
        for j, i in enumerate(a):
            load[i] += w[j]
        if all(load[i] < Q[i] for i in range(m)):
            c = _total(C, a)
            if best is None or c < best:
                best, ba = c, list(a)
    if best is None:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    return {"feasible": True, "assign": ba, "total": best}


def ai_e(C, w, Q):
    """AI-E：先把任务按重量排序，再枚举；用“最重的任务”估计要不要继续。"""
    m, n = len(C), len(w)
    heaviest = max(w)
    biggest = max(Q)
    if heaviest > biggest:
        idx = [i for i in range(m) if Q[i] >= heaviest][0]     # 没有车放得下最重的任务时这里会出错
        return {"feasible": False, "assign": [idx] * n, "total": 0}
    best, ba = None, None
    for a in itertools.product(range(m), repeat=n):
        load = [0] * m
        for j, i in enumerate(a):
            load[i] += w[j]
        if all(load[i] <= Q[i] for i in range(m)):
            c = _total(C, a)
            if best is None or c < best:
                best, ba = c, list(a)
    if best is None:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    return {"feasible": True, "assign": ba, "total": best}


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "OVER_CAPACITY", "AI-B": "NOT_OPTIMAL", "AI-C": "WRONG_TOTAL", "AI-D": "FALSE_INFEASIBLE", "AI-E": "CRASH"}
