"""练习 5 · 审 AI 写的流水车间 C_max 函数（对应 11.1 节）

ai_solvers.py 里有 5 个“AI 写的”函数，接口：fn(P, perm) -> C_max。它们都能跑，但每个都有一个问题。
你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，把问题归类成下面的代码。

    WRONG_M2         在两台机器的实例上就算错了
    WRONG_M3PLUS     两台机器上都对，三台及以上才错
    REVERSED_ORDER   算出来的是“把顺序反过来”的 C_max
    ORDER_IGNORED    结果不随作业顺序变化（而真正的 C_max 会变）
    CRASH            抛了异常

做法提示：oracle.flow_cmax 是独立的参考实现；造一批固定种子的随机实例（instances.random_flow，机器数 1 到 4 都要有），
再补上只有一个作业的边界。好函数必须一个代码都不报。audit 返回代码的集合；集合为空表示没查出问题。
"""
from instances import random_flow  # noqa: F401
from oracle import flow_cmax  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
