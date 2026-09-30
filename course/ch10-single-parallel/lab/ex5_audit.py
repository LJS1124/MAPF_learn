"""练习 5 · 审 AI 写的单机排序规则（对应 10.1、10.2 节）

ai_solvers.py 里有 5 个“AI 写的”函数，接口：fn(p, w, d) -> {"sumC": 顺序, "sumwC": 顺序, "Lmax": 顺序, "sumU": 顺序}，
每个顺序声称对该目标最优（单机、没有释放时间）。它们都能跑，但每个都有一个问题。你要写一个独立的审查器 audit(fn)：
不看源码，只靠运行结果，把问题归类成下面的代码。

    BAD_SUMC / BAD_SUMWC / BAD_LMAX / BAD_SUMU   该目标给出的顺序不是最优的（或不是合法的排列）
    CRASH                                        抛了异常

做法提示：oracle.best_values 是暴力枚举的各目标最优值，oracle.evaluate 重新计算一个顺序的目标值；
造一批固定种子的随机实例（instances.random_jobs），再补上只有一个作业的边界。好函数必须一个代码都不报。
audit 返回代码的集合；集合为空表示没查出问题。
"""
from instances import random_jobs  # noqa: F401
from oracle import best_values, evaluate  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
