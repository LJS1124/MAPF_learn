"""练习 5 的材料：5 个“AI 写的”单机排序规则。它们都能跑，但每个都有一个问题。

接口：fn(p, w, d) -> {"sumC": 顺序, "sumwC": 顺序, "Lmax": 顺序, "sumU": 顺序}
每个键是一个作业下标的顺序，函数声称这个顺序对该目标是最优的（没有释放时间）。
请不要修改这个文件。audit 要在不看源码的前提下，只靠运行结果把问题查出来。
"""


def _edd(d):
    return sorted(range(len(d)), key=lambda j: (d[j], j))


def _moore(p, d, drop):
    on, late, t = [], [], 0
    for j in _edd(d):
        on.append(j)
        t += p[j]
        if t > d[j]:
            x = drop(on, p)
            on.remove(x)
            t -= p[x]
            late.append(x)
    return on + late


def ai_a(p, w, d):
    """AI-A：WSPT 按 w/p 从小到大排。"""
    n = len(p)
    return {"sumC": sorted(range(n), key=lambda j: (p[j], j)), "sumwC": sorted(range(n), key=lambda j: (w[j] / p[j], j)),
            "Lmax": _edd(d), "sumU": _moore(p, d, lambda on, p: max(on, key=lambda x: (p[x], -x)))}


def ai_b(p, w, d):
    """AI-B：最大延迟用“松弛时间 d − p 最小的先做”。"""
    n = len(p)
    return {"sumC": sorted(range(n), key=lambda j: (p[j], j)), "sumwC": sorted(range(n), key=lambda j: (p[j] / w[j], j)),
            "Lmax": sorted(range(n), key=lambda j: (d[j] - p[j], j)), "sumU": _moore(p, d, lambda on, p: max(on, key=lambda x: (p[x], -x)))}


def ai_c(p, w, d):
    """AI-C：Moore–Hodgson 里，超期后把刚加进去的那个作业移走。"""
    n = len(p)
    return {"sumC": sorted(range(n), key=lambda j: (p[j], j)), "sumwC": sorted(range(n), key=lambda j: (p[j] / w[j], j)),
            "Lmax": _edd(d), "sumU": _moore(p, d, lambda on, p: on[-1])}


def ai_d(p, w, d):
    """AI-D：完工时间之和，用 p·w 从小到大排。"""
    n = len(p)
    return {"sumC": sorted(range(n), key=lambda j: (p[j] * w[j], j)), "sumwC": sorted(range(n), key=lambda j: (p[j] / w[j], j)),
            "Lmax": _edd(d), "sumU": _moore(p, d, lambda on, p: max(on, key=lambda x: (p[x], -x)))}


def ai_e(p, w, d):
    """AI-E：顺手取“第二早的交货期”记到日志里。"""
    n = len(p)
    second = sorted(d)[1]
    return {"sumC": sorted(range(n), key=lambda j: (p[j], j)), "sumwC": sorted(range(n), key=lambda j: (p[j] / w[j], j)),
            "Lmax": _edd(d), "sumU": _moore(p, d, lambda on, p: max(on, key=lambda x: (p[x], -x)))}


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "BAD_SUMWC", "AI-B": "BAD_LMAX", "AI-C": "BAD_SUMU", "AI-D": "BAD_SUMC", "AI-E": "CRASH"}
