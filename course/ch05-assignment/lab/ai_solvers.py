"""练习 5 的材料：5 个“AI 写的”派车函数。它们都能跑，多数场景下结果看起来也对，但每个都藏着一个问题。

接口都一样：
    fn(C, allowed=None, penalty=None) -> {"feasible": bool, "assign": list, "total": float}
    C 是 (m, n) 行驶成本；allowed 是 (m, n) 布尔或 None；penalty 是 None / 标量 / 长度 n 的数组。
    assign[j] 是任务 j 的车，延后的任务是 None。

请不要修改这个文件。ex5_audit.py 里的 audit 要在不看源码的前提下，只靠运行结果把它们的问题查出来。
"""
import numpy as np
from scipy.optimize import linear_sum_assignment


def _pad_penalty(P, penalty, n):
    pen = np.broadcast_to(np.asarray(penalty, float), (n,))
    return np.vstack([P, np.tile(pen, (n, 1))]), pen


def _solve(P, m, n, C, penalty, pen=None):
    """公共的收尾：跑指派，把落在虚拟车上的任务记为延后。"""
    rows, cols = linear_sum_assignment(P)
    assign = [None] * n
    total = 0.0
    for i, j in zip(rows, cols):
        if i >= m:
            assign[j] = None
            total += float(pen[j])
        else:
            assign[j] = int(i)
            total += float(C[i][j])
    return assign, total


def ai_a(C, allowed=None, penalty=None):
    """AI-A：禁行边写成 1e6，直接求解，从不报告无解。"""
    C = np.array(C, float)
    m, n = C.shape
    P = C if allowed is None else np.where(allowed, C, 1e6)
    pen = None
    if penalty is not None:
        P, pen = _pad_penalty(P, penalty, n)
    if P.shape[0] < n:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    assign, total = _solve(P, m, n, C, penalty, pen)
    return {"feasible": True, "assign": assign, "total": total}


def ai_b(C, allowed=None, penalty=None):
    """AI-B：禁行边写成“矩阵里的最大值”，理由是“不会比最贵的边更吸引人”。"""
    C = np.array(C, float)
    m, n = C.shape
    P = C if allowed is None else np.where(allowed, C, C.max())
    pen = None
    if penalty is not None:
        P, pen = _pad_penalty(P, penalty, n)
    if P.shape[0] < n:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    assign, total = _solve(P, m, n, C, penalty, pen)
    return {"feasible": True, "assign": assign, "total": total}


def ai_c(C, allowed=None, penalty=None):
    """AI-C：任务比车多又没给罚金时，“先派前 m 个任务”。"""
    C = np.array(C, float)
    m, n = C.shape
    if penalty is None and n > m:
        r, c = linear_sum_assignment(np.where(allowed, C, 1e6)[:, :m] if allowed is not None else C[:, :m])
        assign = [None] * n
        total = 0.0
        for i, j in zip(r, c):
            assign[j] = int(i)
            total += float(C[i][j])
        return {"feasible": True, "assign": assign, "total": total}
    big = 1 + n * (np.abs(C).max() + (np.max(penalty) if penalty is not None else 0))
    P = C if allowed is None else np.where(allowed, C, big)
    pen = None
    if penalty is not None:
        P, pen = _pad_penalty(P, penalty, n)
    assign, total = _solve(P, m, n, C, penalty, pen)
    if any(a is not None and allowed is not None and not allowed[a][j] for j, a in enumerate(assign)):
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    return {"feasible": True, "assign": assign, "total": total}


def ai_d(C, allowed=None, penalty=None):
    """AI-D：延后的任务“没派车，所以不算成本”。"""
    C = np.array(C, float)
    m, n = C.shape
    big = 1 + n * (np.abs(C).max() + (np.max(penalty) if penalty is not None else 0))
    P = C if allowed is None else np.where(allowed, C, big)
    pen = None
    if penalty is not None:
        P, pen = _pad_penalty(P, penalty, n)
    if P.shape[0] < n:
        return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    rows, cols = linear_sum_assignment(P)
    assign = [None] * n
    total = 0.0
    for i, j in zip(rows, cols):
        if i < m:
            if allowed is not None and not allowed[i][j]:
                return {"feasible": False, "assign": [None] * n, "total": float("inf")}
            assign[j] = int(i)
            total += float(C[i][j])
    return {"feasible": True, "assign": assign, "total": total}


def ai_e(C, allowed=None, penalty=None):
    """AI-E：按任务到达顺序，给每个任务挑当前最便宜的空闲车；比罚金还贵就延后。"""
    C = np.array(C, float)
    m, n = C.shape
    pen = None if penalty is None else np.broadcast_to(np.asarray(penalty, float), (n,))
    free = list(range(m))
    assign = [None] * n
    total = 0.0
    for j in range(n):
        cands = [i for i in free if allowed is None or allowed[i][j]]
        best = min(cands, key=lambda i: C[i][j]) if cands else None
        if best is not None and (pen is None or C[best][j] <= pen[j]):
            assign[j] = int(best)
            free.remove(best)
            total += float(C[best][j])
        elif pen is not None:
            total += float(pen[j])
        else:
            return {"feasible": False, "assign": [None] * n, "total": float("inf")}
    return {"feasible": True, "assign": assign, "total": total}


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}

# 每个 AI 函数的主要问题（用来判分；练习里不要偷看）
PRIMARY_CODE = {"AI-A": "FALSE_FEASIBLE", "AI-B": "USES_FORBIDDEN", "AI-C": "TASKS_DROPPED",
                "AI-D": "WRONG_TOTAL", "AI-E": "NOT_OPTIMAL"}
