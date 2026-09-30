"""练习 5 · 审 AI 写的广义指派求解函数（对应 7.3 节）

ai_solvers.py 里有 5 个“AI 写的”函数，接口：fn(C, w, Q) -> {"feasible": bool, "assign": [...], "total": 数}。
它们都能跑，但每个都有一个问题。你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，把问题归类成下面的代码。

    OVER_CAPACITY      某辆车分到的托盘数超过载重
    UNASSIGNED         有任务没有车（或车的下标不合法）
    WRONG_TOTAL        汇报的 total 与按 C 重新计算的不一致
    NOT_OPTIMAL        派法合法，总时间比最优的大
    FALSE_INFEASIBLE   明明有解却报告 feasible=False
    FALSE_FEASIBLE     真的无解（暴力枚举确认）却报告 feasible=True
    CRASH              抛了异常

做法提示：
- oracle.gap_ip 是暴力枚举的最优值（小规模）；重新计算总时间和载重时只信原始的 C、w、Q。
- 造一批固定种子的随机实例（instances.random_gap），再补上几个手造的：无解的、载重恰好用满的。
- 好函数必须一个代码都不报。
audit 返回代码的集合；集合为空表示没查出问题。
"""
from instances import random_gap  # noqa: F401
from oracle import gap_ip  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
