"""练习 5 的材料：5 个“AI 写的”流水车间 C_max 计算函数。它们都能跑，但每个都有一个问题。

接口：fn(P, perm) -> C_max。P[j][k] 是作业 j 在第 k 台机器上的加工时间，所有作业按 perm 的顺序依次经过第 0、1、… 台机器
（每台机器一次只做一个作业，一个作业一次只在一台机器上）。请不要修改这个文件。
audit 要在不看源码的前提下，只靠运行结果把问题查出来。
"""


def _true(P, perm):
    m = len(P[0])
    free = [0] * m
    for j in perm:
        prev = 0
        for k in range(m):
            prev = max(free[k], prev) + P[j][k]
            free[k] = prev
    return free[-1]


def ai_a(P, perm):
    """AI-A：C_max 就是最忙那台机器的总加工时间。"""
    m = len(P[0])
    return max(sum(P[j][k] for j in perm) for k in range(m))


def ai_b(P, perm):
    """AI-B：每台机器上，一个作业开始的时刻取决于同一台机器上前一个作业的完工时间。"""
    m = len(P[0])
    free = [0] * m
    for j in perm:
        for k in range(m):
            free[k] += P[j][k]
    return max(free[k] + sum(P[perm[0]][:k]) for k in range(m))


def ai_c(P, perm):
    """AI-C：end[j][k] = max(作业 j 在上一台机器的完工时间, 机器 k 上前一个作业的完工时间) + p。"""
    m = len(P[0])
    end, prev = {}, None
    for j in perm:
        end[j] = []
        for k in range(m):
            a = end[j][k - 1] if k else 0
            b = 0 if prev is None else end[prev][k if k < 2 else k - 1]
            end[j].append(max(a, b) + P[j][k])
        prev = j
    return end[perm[-1]][-1]


def ai_d(P, perm):
    """AI-D：习惯上从后往前看，先把顺序反过来再算。"""
    return _true(P, list(perm)[::-1])


def ai_e(P, perm):
    """AI-E：顺手把“第二个作业”的名字记到日志里。"""
    second = perm[1]
    return _true(P, perm)


AI_SOLVERS = {"AI-A": ai_a, "AI-B": ai_b, "AI-C": ai_c, "AI-D": ai_d, "AI-E": ai_e}
PRIMARY_CODE = {"AI-A": "ORDER_IGNORED", "AI-B": "WRONG_M2", "AI-C": "WRONG_M3PLUS", "AI-D": "REVERSED_ORDER", "AI-E": "CRASH"}
