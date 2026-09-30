"""练习 4 · 同一个作业车间问题的两种模型：MIP 与 CP（对应 11.4 节）

  mip_jobshop(jobs) -> 最优 C_max（整数）
        大 M 的析取模型，用 scipy.optimize.milp：变量：每道工序的开始时刻 s_o、C_max、同一台机器上每一对不同作业的工序的 y（0/1，1 = 前者在前）。
        约束：作业内 s_next >= s + d；C_max >= 每个作业最后一道工序的 s + d；
        y = 1 时 s_b >= s_a + d_a，y = 0 时 s_a >= s_b + d_b（用 M = 总加工时间松掉另一边）。
  mip_lp_bound(jobs) -> 同一个模型的 LP 松弛值（y 放宽到 [0, 1]，其余不变）
  cp_jobshop(jobs)  -> 最优 C_max
        用 OR-Tools CP-SAT：每道工序一个区间变量，每台机器 AddNoOverlap，作业内先后用 s >= 前一道的结束，最小化最大结束时刻。
判分：两种模型都要给出与暴力枚举相同的最优值；并且页面例子里 MIP 的 LP 松弛值低于最简单的下界 12（大 M 很弱）。
"""
import numpy as np  # noqa: F401
from scipy.optimize import Bounds, LinearConstraint, linprog, milp  # noqa: F401


def mip_jobshop(jobs):
    raise NotImplementedError("练习 4：大 M 的 MIP")


def mip_lp_bound(jobs):
    raise NotImplementedError("练习 4：LP 松弛值")


def cp_jobshop(jobs):
    raise NotImplementedError("练习 4：CP-SAT")
