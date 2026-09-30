"""练习 3 · MTZ 紧凑模型的 LP 松弛（对应 8.3 节）

MTZ 不需要指数多的约束，代价是加辅助变量 u_i（点 i 是路线上的第几个）：
    u_i − u_j + (n−1) x_ij <= n − 2,   i, j ∈ {1..n−1}, i ≠ j
    0 <= u_i <= n − 2（点 0 的 u 不参与约束，可以当作 0 的变量，系数全为 0）
再加每个点出度 = 入度 = 1，0 <= x_ij <= 1。

  mtz_lp(D) -> LP 最优值
        变量顺序：先是 n(n−1) 条弧 x_ij（i 外层、j 内层，跳过 i = j），再是 u_0..u_{n−1}。用 scipy.optimize.linprog。

判分：与参考实现一致；并且 指派松弛 <= MTZ <= 子回路下界 <= 最优。页面例子：203.25。
"""
import numpy as np  # noqa: F401
from scipy.optimize import linprog  # noqa: F401


def mtz_lp(D):
    raise NotImplementedError("练习 3：MTZ 的 LP")
