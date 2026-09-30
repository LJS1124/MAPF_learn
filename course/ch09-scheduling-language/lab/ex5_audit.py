"""练习 5 · 审 AI 写的目标计算函数（对应 9.3 节）

ai_solvers.py 里有 5 个“AI 写的”函数，接口：fn(p, w, d, r, seq) -> {"Cmax", "sumC", "sumwC", "Lmax", "sumT", "sumU", "sumwU"}。
它们都能跑，但每个都有一个问题。你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，把问题归类成下面的代码。

    BAD_<目标>          该目标的值算错了，而且在没有释放时间（r 全为 0）的实例上也错：公式本身有问题。
                        目标名大写：BAD_CMAX、BAD_SUMC、BAD_SUMWC、BAD_LMAX、BAD_SUMT、BAD_SUMU、BAD_SUMWU
    IGNORES_RELEASE    只在有释放时间的实例上算错（没有释放时间时全对）：忽略了释放时间
    CRASH              抛了异常

做法提示：oracle.evaluate 是独立的参考实现；造一批固定种子的随机实例（instances.random_jobs，releases=True/False 各一半），
再补上边界：只有一个作业。好函数必须一个代码都不报。audit 返回代码的集合；集合为空表示没查出问题。
"""
from instances import random_jobs  # noqa: F401
from oracle import KEYS, evaluate  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
