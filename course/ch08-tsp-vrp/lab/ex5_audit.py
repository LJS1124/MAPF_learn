"""练习 5 · 审 AI 写的旅行商函数（对应 8.1 节）

ai_solvers.py 里有 5 个“AI 写的”函数，接口：fn(D) -> {"tour": [...], "length": 汇报的长度}。
它们都能跑，但每个都有一个问题。你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，
把问题归类成下面的代码。

    NOT_HAMILTONIAN   tour 没有恰好把每个点访问一次
    NOT_FROM_DEPOT    tour 不是从仓库（点 0）出发
    WRONG_LENGTH      汇报的 length 与按 D 重新计算的回路长度（含回到起点的那一段）不一致
    NOT_OPTIMAL       回路合法，但比最优的长（oracle.tsp_brute 是暴力枚举，n <= 8 够用）
    CRASH             抛了异常

做法提示：造一批固定种子的随机实例（instances.random_points + dist），
再补上边界：只有仓库一个点、只有一个客户。重新计算长度时只信 D。好函数必须一个代码都不报。
audit 返回代码的集合；集合为空表示没查出问题。
"""
from instances import dist, random_points  # noqa: F401
from oracle import tsp_brute  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
