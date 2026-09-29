"""练习 5 · 审 AI 写的派车函数（对应 5.6 节）

ai_solvers.py 里有 5 个“AI 写的”派车函数，接口与练习 3 的 dispatch 相同。它们都能跑，
但每个都有一个问题。你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，
把问题归类成下面的代码。

    USES_FORBIDDEN     返回的派法用到了 allowed=False 的边
    FALSE_FEASIBLE     真的无解（暴力枚举确认）却报告 feasible=True。这时请顺便看它是怎么“凑”出解的：
                       用了禁行边就再加 USES_FORBIDDEN，没给罚金却有任务没派车就再加 TASKS_DROPPED
    FALSE_INFEASIBLE   明明有解却报告 feasible=False
    TASKS_DROPPED      没给 penalty 时，有任务没被派车却当作可行解返回
    WRONG_TOTAL        汇报的 total 与按原始 C 和 penalty 重新计算的不一致
    NOT_OPTIMAL        派法合法，但总时间比最优的大

做法提示：
- 用 oracle.opt_with_deferral 得到暴力枚举的最优值（小规模，m, n <= 5）。
- 造一批随机实例（种子固定，可复现），要覆盖：有解、无解、有罚金、没罚金、车多、车少。
- 重新计算总时间时只信原始的 C 和 penalty，不要信函数汇报的 total。
- 函数抛异常要捕获，记为 CRASH。
- 好函数（练习 3 的 dispatch）必须一个代码都不报。

audit 返回代码的集合；集合为空表示没查出问题。
"""
import numpy as np  # noqa: F401
from oracle import opt_with_deferral  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
