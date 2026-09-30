"""练习 2 · 并行机的列表调度（对应 9.4 节）

P[i][j] 是作业 j 在机器 i 上的加工时间：相同机器（P）时每一行一样，速度不同（Q）时成比例，不相关（R）时任意。

  list_schedule(P, order) -> (Cmax, assign, load)
        按 order 依次把作业放到“放上去以后完工最早”的机器（并列取编号小的）。
        assign 是 {作业: 机器}，load 是每台机器的总加工时间。
  opt_cmax(P) -> (最优 Cmax, 最优的分配列表)
        枚举每个作业去哪台机器（同一台上的顺序不影响 Cmax）。取第一个严格更小的分配（itertools.product 的字典序）。
  lower_bound_identical(p, m) -> max(最长作业, 总量 ÷ m)（相同机器的下界）
"""
import itertools  # noqa: F401


def list_schedule(P, order):
    raise NotImplementedError("练习 2：列表调度")


def opt_cmax(P):
    raise NotImplementedError("练习 2：枚举最优")


def lower_bound_identical(p, m):
    raise NotImplementedError("练习 2：下界")
