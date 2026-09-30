"""练习 3 · 广义指派（GAP）：LP 松弛与枚举（对应 7.3 节）

m 辆车，n 个任务。C[i][j] 是车 i 做任务 j 的行驶时间，w[j] 是任务 j 的托盘数，Q[i] 是车 i 的载重。
每个任务恰好一辆车，每辆车分到的托盘数不超过载重，总行驶时间最小。注意一辆车可以做多个任务。

  gap_lp(C, w, Q, cuts=()) -> (LP 最优值, x)   x 是 m×n 的数组；无解时返回 (None, None)
        cuts 里每一项 (i, S, k) 表示一条覆盖割：车 i 在任务集合 S 上的 x 之和 <= k。
        可以用 scipy.optimize.linprog。
  gap_enum(C, w, Q)        -> (最优值, assign)  assign[j] 是任务 j 的车；无解返回 (None, None)
        逐个任务选车的回溯，载重超了就剪掉。规模 m^n，n <= 10 时够用。
"""
import numpy as np  # noqa: F401
from scipy.optimize import linprog  # noqa: F401


def gap_lp(C, w, Q, cuts=()):
    raise NotImplementedError("练习 3：LP 松弛")


def gap_enum(C, w, Q):
    raise NotImplementedError("练习 3：枚举")
