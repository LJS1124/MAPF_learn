"""练习 5 · 审 AI 写的最大流函数（对应 6.3 节）

ai_solvers.py 里有 5 个“AI 写的”最大流函数，接口：
    fn(n, arcs, s, t) -> {"value": 汇报的流量, "flow": 每条弧上的流量, "cut": 源侧点集或 None}
它们都能跑，但每个都有一个问题。你要写一个独立的审查器 audit(fn)：不看源码，只靠运行结果，
把问题归类成下面的代码。

    NOT_MAX                   流量合法，但比真正的最大流小
    VIOLATES_CAP              某条弧上的流量为负，或超过容量
    VIOLATES_CONSERVATION     除源、汇外，某个点流入和流出不相等
    WRONG_VALUE               流是合法的，但汇报的 value 与 flow 实际送到汇点的净流量不一致
    BAD_CUT                   给出了 cut，但它不是最小割（源不在里面、汇在里面，或割容量 != 最大流量）
    CRASH                     函数抛了异常

做法提示：
- 用 oracle.max_flow_value（枚举全部割）当作标准答案，用 oracle.check_flow 的思路自己重算流量，不要相信函数汇报的 value。
- 造一批固定种子的随机网络（network.random_network），再补上几个手造的：汇点不可达、需要用回退弧才能到最优的“陷阱”。
  随机图很少触发回退弧，陷阱要自己想：让最短增广路先抢走一条被两条路共用的弧。
- 好函数（练习 2 的 max_flow）必须一个代码都不报。

audit 返回代码的集合；集合为空表示没查出问题。
"""
from oracle import max_flow_value  # noqa: F401
from network import random_network  # noqa: F401


def audit(fn) -> set:
    raise NotImplementedError("练习 5：造实例、跑函数、独立重算、归类问题")
