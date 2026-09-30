"""练习 5 的材料：5 个“AI 写的”单机目标计算函数。它们都能跑，但每个都有一个问题。

接口：fn(p, w, d, r, seq) -> {"Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"}
seq 是作业的加工顺序；每个作业不能在释放时间 r[j] 之前开始。请不要修改这个文件。
audit 要在不看源码的前提下，只靠运行结果把问题查出来。
"""


def _run(p, r, seq, use_release=True):
    t, C = 0, {}
    for j in seq:
        t = (max(t, r[j]) if use_release else t) + p[j]
        C[j] = t
    return C


def _pack(p, w, d, C, tardy_clip=True, weighted=True, lmax_clip=False, cmax=None):
    Ls = [C[j] - d[j] for j in C]
    T = [max(0, x) for x in Ls] if tardy_clip else Ls
    return {"Cmax": max(C.values()) if cmax is None else cmax, "sumC": sum(C.values()),
            "sumwC": sum((w[j] if weighted else 1) * C[j] for j in C),
            "Lmax": max(max(Ls), 0) if lmax_clip else max(Ls), "sumT": sum(T),
            "sumU": sum(1 for x in Ls if x > 0), "sumwU": sum(w[j] for j in C if C[j] > d[j])}


def ai_a(p, w, d, r, seq):
    """AI-A：机器从 0 开始连续加工，不管释放时间。"""
    return _pack(p, w, d, _run(p, r, seq, use_release=False))


def ai_b(p, w, d, r, seq):
    """AI-B：延误时间 T_j = C_j − d_j，直接求和。"""
    return _pack(p, w, d, _run(p, r, seq), tardy_clip=False)


def ai_c(p, w, d, r, seq):
    """AI-C：加权完工时间之和，忘了乘权重。"""
    return _pack(p, w, d, _run(p, r, seq), weighted=False)


def ai_d(p, w, d, r, seq):
    """AI-D：最大延迟取 max(0, 最大的 C_j − d_j)，“提前完成就算 0”。"""
    return _pack(p, w, d, _run(p, r, seq), lmax_clip=True)


def ai_e(p, w, d, r, seq):
    """AI-E：顺手把“倒数第二大的延迟”打印到日志里，方便排查。"""
    C = _run(p, r, seq)
    second = sorted(C[j] - d[j] for j in C)[-2]
    return _pack(p, w, d, C)


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "IGNORES_RELEASE", "AI-B": "BAD_SUMT", "AI-C": "BAD_SUMWC", "AI-D": "BAD_LMAX", "AI-E": "CRASH"}
